/**
 * HsIfr — shared HubSpot __hs-ifr message protocol helpers.
 *
 * Consolidates the duplicated message-envelope construction and iframe guard
 * checks in index.html (sendSync, sendHsIfrMessage, sendEmbeddedPropsChanged,
 * sendInvokeFunction all share the same structure).
 *
 * Usage:
 *   var msg = HsIfr.buildMessage({ to: embedId, payload: { type: 'SYNC', ... } });
 *   if (HsIfr.requireIframe(iframeEl, log) && HsIfr.requireTrust(trusted, log)) {
 *     HsIfr.send(iframeEl, msg);
 *   }
 */
window.HsIfr = (function () {
  var FORMAT = '__hs-ifr';

  function buildMessage(opts) {
    return {
      id:      crypto.randomUUID(),
      format:  FORMAT,
      from:    opts.from || 'HOST',
      to:      opts.to   || '*',
      v:       opts.v    || 1,
      payload: opts.payload || {}
    };
  }

  function requireIframe(iframeEl, logFn) {
    if (!iframeEl || !iframeEl.contentWindow) {
      if (logFn) logFn('iframe not ready', 'error');
      return false;
    }
    return true;
  }

  function requireTrust(trusted, logFn, msg) {
    if (!trusted) {
      if (logFn) logFn(msg || 'Origin not yet trusted — waiting for SYNC_ACK first', 'error');
      return false;
    }
    return true;
  }

  function send(iframeEl, msg) {
    iframeEl.contentWindow.postMessage(msg, '*');
  }

  function buildAndSend(iframeEl, opts) {
    var msg = buildMessage(opts);
    send(iframeEl, msg);
    return msg;
  }

  return {
    FORMAT: FORMAT,
    buildMessage: buildMessage,
    requireIframe: requireIframe,
    requireTrust: requireTrust,
    send: send,
    buildAndSend: buildAndSend
  };
})();
