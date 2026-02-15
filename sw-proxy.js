// Service Worker for intercepting requests and responses

self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Only intercept requests from our origin or requests made by the iframe
    // Skip the service worker script itself
    if (url.pathname === '/sw-proxy.js') {
        return;
    }
    
    event.respondWith(
        fetch(event.request.clone())
            .then(async (response) => {
                // Clone the response so we can read it
                const responseClone = response.clone();
                
                try {
                    const contentType = response.headers.get('content-type') || '';
                    let bodyPreview = null;
                    
                    // Try to get body preview for text-based content
                    if (contentType.includes('text/') || 
                        contentType.includes('application/json') || 
                        contentType.includes('application/xml') ||
                        contentType.includes('application/javascript')) {
                        
                        try {
                            const text = await responseClone.text();
                            
                            // Get first 3 lines or first 500 characters
                            const lines = text.split('\n');
                            const firstLines = lines.slice(0, 3).join('\n');
                            bodyPreview = firstLines.substring(0, 500);
                            
                            if (text.length > 500 || lines.length > 3) {
                                bodyPreview += '\n... (truncated)';
                            }
                        } catch (e) {
                            bodyPreview = `[Error reading body: ${e.message}]`;
                        }
                    } else {
                        bodyPreview = `[Binary content: ${contentType}]`;
                    }
                    
                    // Send intercepted data to all clients
                    const clients = await self.clients.matchAll();
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'intercepted',
                            url: event.request.url,
                            method: event.request.method,
                            status: response.status,
                            statusText: response.statusText,
                            contentType: contentType,
                            bodyPreview: bodyPreview
                        });
                    });
                } catch (error) {
                    console.error('Error processing response:', error);
                }
                
                return response;
            })
            .catch((error) => {
                console.error('Fetch failed:', error);
                
                // Notify clients of the error
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'intercepted',
                            url: event.request.url,
                            method: event.request.method,
                            status: 0,
                            statusText: 'Network Error',
                            contentType: '',
                            bodyPreview: `[Fetch failed: ${error.message}]`
                        });
                    });
                });
                
                throw error;
            })
    );
});
