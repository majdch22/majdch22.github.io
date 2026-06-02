const {
  isTextContent,
  buildBodyPreview,
  buildInterceptedMessage,
  headersToObject,
  shouldSkipRequest,
} = require('../lib/sw-proxy-utils');

describe('sw-proxy-utils', () => {
  // ── isTextContent ─────────────────────────────────────────
  describe('isTextContent', () => {
    it('returns true for text/html', () => {
      expect(isTextContent('text/html')).toBe(true);
    });

    it('returns true for text/plain', () => {
      expect(isTextContent('text/plain')).toBe(true);
    });

    it('returns true for application/json', () => {
      expect(isTextContent('application/json')).toBe(true);
    });

    it('returns true for application/xml', () => {
      expect(isTextContent('application/xml')).toBe(true);
    });

    it('returns true for application/javascript', () => {
      expect(isTextContent('application/javascript')).toBe(true);
    });

    it('returns true for content types with parameters', () => {
      expect(isTextContent('text/html; charset=utf-8')).toBe(true);
      expect(isTextContent('application/json; charset=utf-8')).toBe(true);
    });

    it('returns false for image/png', () => {
      expect(isTextContent('image/png')).toBe(false);
    });

    it('returns false for application/octet-stream', () => {
      expect(isTextContent('application/octet-stream')).toBe(false);
    });

    it('returns false for null/undefined/empty', () => {
      expect(isTextContent(null)).toBe(false);
      expect(isTextContent(undefined)).toBe(false);
      expect(isTextContent('')).toBe(false);
    });
  });

  // ── buildBodyPreview ──────────────────────────────────────
  describe('buildBodyPreview', () => {
    it('returns full text when under limits', () => {
      expect(buildBodyPreview('hello')).toBe('hello');
    });

    it('truncates to 3 lines by default', () => {
      const text = 'line1\nline2\nline3\nline4\nline5';
      const preview = buildBodyPreview(text);
      expect(preview).toBe('line1\nline2\nline3\n... (truncated)');
    });

    it('truncates to maxChars', () => {
      const text = 'a'.repeat(1500);
      const preview = buildBodyPreview(text);
      expect(preview).toBe('a'.repeat(1000) + '\n... (truncated)');
    });

    it('does not append truncation notice when exactly at limits', () => {
      const text = 'line1\nline2\nline3';
      const preview = buildBodyPreview(text);
      expect(preview).toBe('line1\nline2\nline3');
    });

    it('handles empty string', () => {
      expect(buildBodyPreview('')).toBe('');
    });

    it('handles non-string input', () => {
      expect(buildBodyPreview(null)).toBe('');
      expect(buildBodyPreview(undefined)).toBe('');
    });

    it('respects custom maxChars and maxLines', () => {
      const text = 'line1\nline2\nline3';
      const preview = buildBodyPreview(text, 10, 1);
      expect(preview).toBe('line1\n... (truncated)');
    });
  });

  // ── buildInterceptedMessage ────────────────────────────────
  describe('buildInterceptedMessage', () => {
    it('builds a correctly shaped message', () => {
      const msg = buildInterceptedMessage({
        url: 'https://example.com/api',
        method: 'GET',
        status: 200,
        statusText: 'OK',
        requestHeaders: { accept: 'text/html' },
        responseHeaders: { 'content-type': 'text/html' },
        contentType: 'text/html',
        bodyPreview: '<html>',
      });

      expect(msg.type).toBe('intercepted');
      expect(msg.url).toBe('https://example.com/api');
      expect(msg.method).toBe('GET');
      expect(msg.status).toBe(200);
      expect(msg.statusText).toBe('OK');
      expect(msg.requestHeaders).toEqual({ accept: 'text/html' });
      expect(msg.responseHeaders).toEqual({ 'content-type': 'text/html' });
      expect(msg.bodyPreview).toBe('<html>');
    });

    it('defaults missing optional fields', () => {
      const msg = buildInterceptedMessage({
        url: 'https://x.com',
        method: 'POST',
        status: 500,
        statusText: 'Error',
      });
      expect(msg.requestHeaders).toEqual({});
      expect(msg.responseHeaders).toEqual({});
      expect(msg.contentType).toBe('');
      expect(msg.bodyPreview).toBeNull();
    });
  });

  // ── headersToObject ───────────────────────────────────────
  describe('headersToObject', () => {
    it('converts entries to plain object', () => {
      const entries = [
        ['content-type', 'text/html'],
        ['x-custom', 'value'],
      ];
      expect(headersToObject(entries)).toEqual({
        'content-type': 'text/html',
        'x-custom': 'value',
      });
    });

    it('handles empty entries', () => {
      expect(headersToObject([])).toEqual({});
    });
  });

  // ── shouldSkipRequest ─────────────────────────────────────
  describe('shouldSkipRequest', () => {
    it('returns true for the SW script path', () => {
      expect(shouldSkipRequest('/sw-proxy.js')).toBe(true);
    });

    it('returns true when path contains sw-proxy.js anywhere', () => {
      expect(shouldSkipRequest('/assets/sw-proxy.js?v=1')).toBe(true);
    });

    it('returns false for other paths', () => {
      expect(shouldSkipRequest('/index.html')).toBe(false);
      expect(shouldSkipRequest('/api/data')).toBe(false);
    });
  });
});
