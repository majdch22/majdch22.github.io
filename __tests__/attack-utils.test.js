const {
  GCFIDS_CHARS,
  generateRandomId,
  buildGcfidsPayload,
  getTestVectors,
  stringifyPayload,
} = require('../lib/attack-utils');

describe('attack-utils', () => {
  // ── generateRandomId ──────────────────────────────────────
  describe('generateRandomId', () => {
    it('generates a string of length 80–99', () => {
      for (let i = 0; i < 20; i++) {
        const id = generateRandomId();
        expect(id.length).toBeGreaterThanOrEqual(80);
        expect(id.length).toBeLessThan(100);
      }
    });

    it('only contains characters from the GCFIDS charset', () => {
      const id = generateRandomId();
      for (const ch of id) {
        expect(GCFIDS_CHARS).toContain(ch);
      }
    });

    it('produces different IDs on successive calls', () => {
      const a = generateRandomId();
      const b = generateRandomId();
      expect(a).not.toBe(b);
    });

    it('accepts a custom RNG for deterministic output', () => {
      let counter = 0;
      const fakeRng = () => {
        counter++;
        return 0; // always picks first char, length = 80
      };
      const id = generateRandomId(fakeRng);
      expect(id.length).toBe(80);
      expect(id).toBe('A'.repeat(80));
    });

    it('returns max length when rng approaches 1', () => {
      const id = generateRandomId(() => 0.999);
      expect(id.length).toBe(99);
    });
  });

  // ── buildGcfidsPayload ────────────────────────────────────
  describe('buildGcfidsPayload', () => {
    it('wraps an id into the gcfids structure', () => {
      const payload = buildGcfidsPayload('abc123');
      expect(payload).toEqual({
        action: 'gcfids',
        data: { id: 'abc123' },
      });
    });

    it('handles null id', () => {
      const payload = buildGcfidsPayload(null);
      expect(payload.data.id).toBeNull();
    });
  });

  // ── getTestVectors ────────────────────────────────────────
  describe('getTestVectors', () => {
    const vectors = getTestVectors();

    it('returns all 8 expected vectors', () => {
      expect(Object.keys(vectors)).toHaveLength(8);
    });

    it.each([
      'null-id',
      'empty-id',
      'xss-id',
      'proto-pollution',
      'long-id',
      'special-chars',
      'sqli',
      'path-traversal',
    ])('vector "%s" has action=gcfids', (name) => {
      expect(vectors[name].action).toBe('gcfids');
    });

    it('null-id vector has null id', () => {
      expect(vectors['null-id'].data.id).toBeNull();
    });

    it('empty-id vector has empty string id', () => {
      expect(vectors['empty-id'].data.id).toBe('');
    });

    it('xss-id vector contains HTML', () => {
      expect(vectors['xss-id'].data.id).toContain('<img');
      expect(vectors['xss-id'].data.id).toContain('onerror');
    });

    it('long-id vector has 9999 characters', () => {
      expect(vectors['long-id'].data.id.length).toBe(9999);
    });

    it('sqli vector contains SQL injection pattern', () => {
      expect(vectors['sqli'].data.id).toContain("OR 1=1");
    });

    it('path-traversal vector contains ../', () => {
      expect(vectors['path-traversal'].data.id).toContain('../');
    });
  });

  // ── stringifyPayload ──────────────────────────────────────
  describe('stringifyPayload', () => {
    it('JSON-stringifies objects', () => {
      const str = stringifyPayload({ action: 'gcfids', data: { id: 'x' } });
      expect(JSON.parse(str)).toEqual({ action: 'gcfids', data: { id: 'x' } });
    });

    it('handles nested objects', () => {
      const payload = { a: { b: { c: 1 } } };
      expect(JSON.parse(stringifyPayload(payload))).toEqual(payload);
    });
  });
});
