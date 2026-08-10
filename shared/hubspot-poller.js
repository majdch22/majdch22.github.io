/**
 * HubSpotPoller — shared popup-open-and-poll utility.
 *
 * Consolidates the nearly identical HubSpot popup + cross-origin polling
 * pattern found in collector.html and sandbox.html (~50 lines each).
 *
 * Usage:
 *   HubSpotPoller.openAndPoll({
 *     url: 'https://app-eu1.hubspot.com',
 *     onLoaded: function(hub, attempts) { ... },
 *     onBlocked: function() { log('popup blocked'); }
 *   });
 */
window.HubSpotPoller = (function () {
  /**
   * @param {Object} opts
   * @param {string}   [opts.url='https://app-eu1.hubspot.com']
   * @param {string}   [opts.windowName='hubspot']
   * @param {string}   [opts.windowFeatures='width=800,height=600']
   * @param {number}   [opts.maxAttempts=150]
   * @param {number}   [opts.pollInterval=100]
   * @param {number}   [opts.progressEvery=10] - Call onProgress every N attempts
   * @param {Function} [opts.onBlocked]   - Called if popup was blocked
   * @param {Function} [opts.onOpened]    - Called with (windowRef) after open
   * @param {Function} [opts.onLoaded]    - Called with (windowRef, attempts, errorMsg)
   * @param {Function} [opts.onTimeout]   - Called with (attempts)
   * @param {Function} [opts.onProgress]  - Called with (attempts) periodically
   * @param {Function} [opts.onError]     - Called with (errorMessage)
   * @returns {Window|null}
   */
  function openAndPoll(opts) {
    opts = opts || {};

    var url            = opts.url            || 'https://app-eu1.hubspot.com';
    var windowName     = opts.windowName     || 'hubspot';
    var windowFeatures = opts.windowFeatures || 'width=800,height=600';
    var maxAttempts    = opts.maxAttempts     || 150;
    var pollInterval   = opts.pollInterval   || 100;
    var progressEvery  = opts.progressEvery  || 10;
    var onBlocked      = opts.onBlocked      || function () {};
    var onOpened       = opts.onOpened        || function () {};
    var onLoaded       = opts.onLoaded        || function () {};
    var onTimeout      = opts.onTimeout       || function () {};
    var onProgress     = opts.onProgress      || function () {};
    var onError        = opts.onError         || function () {};

    try {
      var hub = window.open(url, windowName, windowFeatures);

      if (!hub) {
        onBlocked();
        return null;
      }

      onOpened(hub);

      var attempts = 0;
      var checker = setInterval(function () {
        attempts++;

        try {
          hub.origin; // throws when cross-origin
          if (attempts % progressEvery === 0) {
            onProgress(attempts);
          }
        } catch (e) {
          clearInterval(checker);
          onLoaded(hub, attempts, e.message);
          return;
        }

        if (attempts > maxAttempts) {
          clearInterval(checker);
          onTimeout(attempts);
        }
      }, pollInterval);

      return hub;
    } catch (err) {
      onError(err.message);
      return null;
    }
  }

  return { openAndPoll: openAndPoll };
})();
