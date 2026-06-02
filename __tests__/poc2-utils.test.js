const {
  testL0Bypass,
  isProtocolRelative,
  detectsExternalRedirect,
} = require('../lib/poc2-utils');

describe('poc2-utils', () => {
  // ── testL0Bypass ──────────────────────────────────────────
  describe('testL0Bypass', () => {
    it('protocol-relative URL passes the L0 check (the vulnerability)', () => {
      const result = testL0Bypass('//evil.com', 'https://1win.com');
      expect(result.passes).toBe(true);
      expect(result.protocol).toBe('https:');
      expect(result.href).toBe('https://evil.com/');
      expect(result.hostname).toBe('evil.com');
    });

    it('absolute https URL passes', () => {
      const result = testL0Bypass('https://safe.com/page', 'https://1win.com');
      expect(result.passes).toBe(true);
      expect(result.hostname).toBe('safe.com');
    });

    it('http URL does not pass', () => {
      const result = testL0Bypass('http://evil.com', 'https://1win.com');
      expect(result.passes).toBe(false);
      expect(result.protocol).toBe('http:');
    });

    it('javascript: URL does not pass', () => {
      const result = testL0Bypass('javascript:alert(1)', 'https://1win.com');
      expect(result.passes).toBe(false);
    });

    it('relative path resolves to same origin and passes', () => {
      const result = testL0Bypass('/deposit', 'https://1win.com');
      expect(result.passes).toBe(true);
      expect(result.hostname).toBe('1win.com');
    });

    it('data: URL does not pass', () => {
      const result = testL0Bypass('data:text/html,hi', 'https://1win.com');
      expect(result.passes).toBe(false);
      expect(result.protocol).toBe('data:');
    });

    it('protocol-relative with path passes and preserves path', () => {
      const result = testL0Bypass('//evil.com/steal?q=1', 'https://1win.com');
      expect(result.passes).toBe(true);
      expect(result.href).toBe('https://evil.com/steal?q=1');
    });

    it('treats ://invalid as relative path (resolves to base origin)', () => {
      const result = testL0Bypass('://invalid', 'https://1win.com');
      expect(result.passes).toBe(true);
      expect(result.hostname).toBe('1win.com');
    });

    it('returns error for truly unparseable URL', () => {
      const result = testL0Bypass('http://%', 'https://1win.com');
      expect(result.passes).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ── isProtocolRelative ────────────────────────────────────
  describe('isProtocolRelative', () => {
    it('returns true for //evil.com', () => {
      expect(isProtocolRelative('//evil.com')).toBe(true);
    });

    it('returns true for //evil.com/path', () => {
      expect(isProtocolRelative('//evil.com/path')).toBe(true);
    });

    it('returns false for https://...', () => {
      expect(isProtocolRelative('https://evil.com')).toBe(false);
    });

    it('returns false for relative paths', () => {
      expect(isProtocolRelative('/path')).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(isProtocolRelative(null)).toBe(false);
      expect(isProtocolRelative(123)).toBe(false);
    });
  });

  // ── detectsExternalRedirect ───────────────────────────────
  describe('detectsExternalRedirect', () => {
    it('detects //evil.com as external to 1win.com', () => {
      expect(detectsExternalRedirect('//evil.com', 'https://1win.com')).toBe(true);
    });

    it('returns false for same-host protocol-relative', () => {
      expect(detectsExternalRedirect('//1win.com/page', 'https://1win.com')).toBe(false);
    });

    it('returns false for non-protocol-relative URLs', () => {
      expect(detectsExternalRedirect('https://evil.com', 'https://1win.com')).toBe(false);
    });

    it('returns false for relative paths', () => {
      expect(detectsExternalRedirect('/page', 'https://1win.com')).toBe(false);
    });

    it('detects subdomain differences', () => {
      expect(detectsExternalRedirect('//sub.evil.com', 'https://1win.com')).toBe(true);
    });
  });
});
