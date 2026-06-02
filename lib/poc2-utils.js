/**
 * Utility functions extracted from poc2.html
 * Protocol-relative URL bypass detection for the L0() / jI() open redirect.
 */

/**
 * Simulate the vulnerable L0() check from billing-1SVq9ZSc.js:
 *   new URL(url, window.location.origin).protocol === 'https:'
 *
 * Returns an object describing whether the bypass succeeds.
 */
function testL0Bypass(url, baseOrigin) {
  try {
    const resolved = new URL(url, baseOrigin);
    return {
      passes: resolved.protocol === 'https:',
      protocol: resolved.protocol,
      href: resolved.href,
      hostname: resolved.hostname,
    };
  } catch (err) {
    return {
      passes: false,
      error: err.message,
    };
  }
}

/**
 * Check whether a URL is protocol-relative (starts with "//").
 */
function isProtocolRelative(url) {
  return typeof url === 'string' && url.startsWith('//');
}

/**
 * Determine whether a protocol-relative URL would redirect to an
 * external host when resolved against the given origin.
 */
function detectsExternalRedirect(url, baseOrigin) {
  if (!isProtocolRelative(url)) return false;
  try {
    const resolved = new URL(url, baseOrigin);
    const base = new URL(baseOrigin);
    return resolved.hostname !== base.hostname;
  } catch {
    return false;
  }
}

module.exports = {
  testL0Bypass,
  isProtocolRelative,
  detectsExternalRedirect,
};
