/**
 * PocLogger — shared logging utility for PoC pages.
 *
 * Consolidates the duplicated log() / clearLog() implementations found in
 * index.html, attack.html, collector.html, sandbox.html, and poc2.html.
 *
 * Usage:
 *   const logger = PocLogger.create({ timestampFormat: 'iso' });
 *   logger.log('hello', 'status');
 *   logger.clear();
 */
window.PocLogger = (function () {
  /**
   * @param {Object} opts
   * @param {HTMLElement|string} [opts.element='log']  - Element or id
   * @param {'iso'|'iso-ms'|'locale'|'none'} [opts.timestampFormat='iso']
   * @param {boolean}  [opts.prepend=false]   - Prepend entries (collector style)
   * @param {boolean}  [opts.useTextContent=true] - Use textContent (XSS-safe) vs innerHTML
   * @param {string}   [opts.entryBaseClass='']   - CSS class added to every entry
   * @param {boolean}  [opts.showCount=false]     - Show message counter
   * @param {Function} [opts.onLog]               - Hook called after each log(msg)
   */
  function create(opts) {
    opts = opts || {};

    var logEl = typeof opts.element === 'string'
      ? document.getElementById(opts.element)
      : (opts.element || document.getElementById('log'));

    var counter        = 0;
    var prepend        = opts.prepend || false;
    var useTextContent = opts.useTextContent !== false;
    var tsFormat       = opts.timestampFormat || 'iso';
    var baseClass      = opts.entryBaseClass || '';
    var showCount      = opts.showCount || false;
    var onLog          = opts.onLog || null;

    function getTimestamp() {
      var d = new Date();
      switch (tsFormat) {
        case 'iso':    return d.toISOString().split('T')[1].split('.')[0];
        case 'iso-ms': return d.toISOString().slice(11, 23);
        case 'locale': return d.toLocaleTimeString();
        case 'none':   return null;
        default:       return d.toISOString().split('T')[1].split('.')[0];
      }
    }

    function log(msg, cls) {
      counter++;
      var ts     = getTimestamp();
      var prefix = ts ? '[' + ts + '] ' : '';
      if (showCount) prefix += '#' + counter + ': ';

      if (useTextContent) {
        var el = document.createElement('div');
        var classes = [baseClass, cls].filter(Boolean).join(' ');
        if (classes) el.className = classes;
        el.textContent = prefix + msg;
        if (prepend) logEl.insertBefore(el, logEl.firstChild);
        else         logEl.appendChild(el);
      } else {
        var escapedCls = cls ? ' class="' + cls + '"' : '';
        var html = '<div' + escapedCls + '>' + prefix + msg + '</div>';
        if (prepend) logEl.innerHTML = html + logEl.innerHTML;
        else         logEl.innerHTML += html;
      }

      logEl.scrollTop = prepend ? 0 : logEl.scrollHeight;

      if (onLog) onLog(msg, counter);

      return counter;
    }

    function clear() {
      logEl.innerHTML = '';
      counter = 0;
    }

    function getCount() { return counter; }

    return { log: log, clear: clear, getCount: getCount };
  }

  return { create: create };
})();
