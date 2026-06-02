/**
 * Utility functions extracted from sw-proxy.js
 * Service worker request/response interception helpers.
 */

/**
 * Determine whether a content-type header value represents text-based content
 * that should have its body previewed.
 */
function isTextContent(contentType) {
  if (!contentType) return false;
  return (
    contentType.includes('text/') ||
    contentType.includes('application/json') ||
    contentType.includes('application/xml') ||
    contentType.includes('application/javascript')
  );
}

/**
 * Build a truncated body preview: first 3 lines, capped at 1000 chars.
 * Appends a truncation notice when the full text exceeds the preview.
 */
function buildBodyPreview(text, maxChars = 1000, maxLines = 3) {
  if (typeof text !== 'string') return '';
  const lines = text.split('\n');
  const firstLines = lines.slice(0, maxLines).join('\n');
  let preview = firstLines.substring(0, maxChars);
  if (text.length > maxChars || lines.length > maxLines) {
    preview += '\n... (truncated)';
  }
  return preview;
}

/**
 * Build the intercepted-request message object that sw-proxy.js posts
 * to connected clients.
 */
function buildInterceptedMessage({
  url,
  method,
  status,
  statusText,
  requestHeaders,
  responseHeaders,
  contentType,
  bodyPreview,
}) {
  return {
    type: 'intercepted',
    url,
    method,
    status,
    statusText,
    requestHeaders: requestHeaders || {},
    responseHeaders: responseHeaders || {},
    contentType: contentType || '',
    bodyPreview: bodyPreview || null,
  };
}

/**
 * Convert a Headers-like iterable of [key, value] pairs into a plain object.
 */
function headersToObject(entries) {
  const obj = {};
  for (const [key, value] of entries) {
    obj[key] = value;
  }
  return obj;
}

/**
 * Check whether a URL pathname should be skipped by the service worker
 * (the SW skips its own script).
 */
function shouldSkipRequest(pathname) {
  return pathname.includes('sw-proxy.js');
}

module.exports = {
  isTextContent,
  buildBodyPreview,
  buildInterceptedMessage,
  headersToObject,
  shouldSkipRequest,
};
