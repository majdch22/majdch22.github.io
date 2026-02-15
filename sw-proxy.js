// Service Worker for intercepting requests and responses
// Captures: Request headers, cookies, response headers, and response body

console.log('[SW] Service Worker script loaded');

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip the service worker script itself
    if (url.pathname.includes('sw-proxy.js')) {
        return;
    }
    
    console.log('[SW] Intercepting:', event.request.method, event.request.url);
    
    event.respondWith(
        (async () => {
            // Capture REQUEST data
            const requestHeaders = {};
            for (const [key, value] of event.request.headers.entries()) {
                requestHeaders[key] = value;
            }
            
            console.log('[SW] Request headers:', requestHeaders);
            
            try {
                // Make the fetch request
                const response = await fetch(event.request.clone());
                console.log('[SW] Response received:', response.status, event.request.url);
                
                // Clone the response so we can read it
                const responseClone = response.clone();
                
                // Capture RESPONSE headers
                const responseHeaders = {};
                for (const [key, value] of response.headers.entries()) {
                    responseHeaders[key] = value;
                }
                
                const contentType = response.headers.get('content-type') || '';
                let bodyPreview = null;
                
                // Try to get body preview for text-based content
                if (contentType.includes('text/') || 
                    contentType.includes('application/json') || 
                    contentType.includes('application/xml') ||
                    contentType.includes('application/javascript')) {
                    
                    try {
                        const text = await responseClone.text();
                        
                        // Get first 3 lines or first 1000 characters (increased limit)
                        const lines = text.split('\n');
                        const firstLines = lines.slice(0, 3).join('\n');
                        bodyPreview = firstLines.substring(0, 1000);
                        
                        if (text.length > 1000 || lines.length > 3) {
                            bodyPreview += '\n... (truncated)';
                        }
                        
                        console.log('[SW] Body preview length:', bodyPreview.length);
                    } catch (e) {
                        bodyPreview = `[Error reading body: ${e.message}]`;
                        console.error('[SW] Error reading body:', e);
                    }
                } else {
                    bodyPreview = `[Binary content: ${contentType}]`;
                }
                
                // Prepare the message with full details
                const message = {
                    type: 'intercepted',
                    url: event.request.url,
                    method: event.request.method,
                    status: response.status,
                    statusText: response.statusText,
                    requestHeaders: requestHeaders,
                    responseHeaders: responseHeaders,
                    contentType: contentType,
                    bodyPreview: bodyPreview
                };
                
                console.log('[SW] Sending message to clients');
                
                // Send intercepted data to all clients
                const clients = await self.clients.matchAll({ 
                    includeUncontrolled: true, 
                    type: 'window' 
                });
                
                console.log('[SW] Found clients:', clients.length);
                
                clients.forEach(client => {
                    console.log('[SW] Posting message to client:', client.id);
                    client.postMessage(message);
                });
                
                return response;
                
            } catch (error) {
                console.error('[SW] Fetch failed:', error);
                
                // Notify clients of the error
                const clients = await self.clients.matchAll({ 
                    includeUncontrolled: true, 
                    type: 'window' 
                });
                
                const message = {
                    type: 'intercepted',
                    url: event.request.url,
                    method: event.request.method,
                    status: 0,
                    statusText: 'Network Error',
                    requestHeaders: requestHeaders,
                    responseHeaders: {},
                    contentType: '',
                    bodyPreview: `[Fetch failed: ${error.message}]`
                };
                
                clients.forEach(client => {
                    client.postMessage(message);
                });
                
                throw error;
            }
        })()
    );
});

console.log('[SW] All event listeners registered');
