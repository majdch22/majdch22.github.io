const {
  HS_IFR,
  buildCopilotAction,
  buildSyncMessage,
  buildHsIfrMessage,
  classifyMessage,
  objectTypeLabel,
  buildChatspotUrl,
  capabilityMayContainData,
} = require('../lib/index-utils');

describe('index-utils', () => {
  // ── buildCopilotAction ────────────────────────────────────
  describe('buildCopilotAction', () => {
    it('encodes intent only', () => {
      const result = buildCopilotAction('object_summary');
      const decoded = JSON.parse(decodeURIComponent(result));
      expect(decoded.intent).toBe('object_summary');
    });

    it('merges extra fields into the action', () => {
      const result = buildCopilotAction('object_summary', {
        objectId: '123',
        objectTypeId: '0-1',
      });
      const decoded = JSON.parse(decodeURIComponent(result));
      expect(decoded).toEqual({
        intent: 'object_summary',
        objectId: '123',
        objectTypeId: '0-1',
      });
    });

    it('returns a URI-encoded string', () => {
      const result = buildCopilotAction('test', { key: 'value with spaces' });
      expect(result).not.toContain(' ');
      expect(result).toContain('%');
    });
  });

  // ── buildSyncMessage ──────────────────────────────────────
  describe('buildSyncMessage', () => {
    it('produces a correctly shaped SYNC envelope', () => {
      const msg = buildSyncMessage('embed-123');
      expect(msg.format).toBe(HS_IFR);
      expect(msg.from).toBe('HOST');
      expect(msg.to).toBe('embed-123');
      expect(msg.v).toBe(1);
      expect(msg.payload.type).toBe('SYNC');
      expect(msg.payload.embedId).toBe('embed-123');
      expect(msg.payload.group).toBe('iframeable');
    });
  });

  // ── buildHsIfrMessage ─────────────────────────────────────
  describe('buildHsIfrMessage', () => {
    it('builds an envelope with the given payload type', () => {
      const msg = buildHsIfrMessage('SET_COMPONENT_STATE', { foo: 'bar' }, 'cs-1');
      expect(msg.format).toBe(HS_IFR);
      expect(msg.to).toBe('cs-1');
      expect(msg.payload.type).toBe('SET_COMPONENT_STATE');
      expect(msg.payload.foo).toBe('bar');
    });

    it('defaults to wildcard when chatspotId is absent', () => {
      const msg = buildHsIfrMessage('PING', {});
      expect(msg.to).toBe('*');
    });
  });

  // ── classifyMessage ───────────────────────────────────────
  describe('classifyMessage', () => {
    it('returns NON_IFR for messages without __hs-ifr format', () => {
      expect(classifyMessage({ format: 'other', payload: { type: 'X' } })).toBe('NON_IFR');
    });

    it('returns payload type for valid __hs-ifr messages', () => {
      expect(classifyMessage({ format: HS_IFR, payload: { type: 'SYNC_ACK' } })).toBe('SYNC_ACK');
    });

    it('falls back to data.type when payload.type is missing', () => {
      expect(classifyMessage({ format: HS_IFR, type: 'READY', payload: {} })).toBe('READY');
    });

    it('returns UNKNOWN for __hs-ifr messages with no type', () => {
      expect(classifyMessage({ format: HS_IFR, payload: {} })).toBe('UNKNOWN');
    });

    it('returns null for null/undefined data', () => {
      expect(classifyMessage(null)).toBeNull();
      expect(classifyMessage(undefined)).toBeNull();
    });
  });

  // ── objectTypeLabel ───────────────────────────────────────
  describe('objectTypeLabel', () => {
    it('maps 0-1 to Contact', () => {
      expect(objectTypeLabel('0-1')).toBe('Contact');
    });

    it('maps 0-2 to Company', () => {
      expect(objectTypeLabel('0-2')).toBe('Company');
    });

    it('maps 0-3 to Deal', () => {
      expect(objectTypeLabel('0-3')).toBe('Deal');
    });

    it('returns Unknown for unrecognised values', () => {
      expect(objectTypeLabel('0-99')).toBe('Unknown');
      expect(objectTypeLabel('')).toBe('Unknown');
    });
  });

  // ── buildChatspotUrl ──────────────────────────────────────
  describe('buildChatspotUrl', () => {
    it('builds URL with copilotAction when provided', () => {
      const url = buildChatspotUrl('12345', 'encodedAction', 'thread-1');
      expect(url).toContain('copilotAction=encodedAction');
      expect(url).toContain('chatspot-widget-ui/12345/chat');
      expect(url).toContain('copilotThreadId=thread-1');
    });

    it('omits copilotAction when not provided', () => {
      const url = buildChatspotUrl('12345', null, 'thread-2');
      expect(url).not.toContain('copilotAction');
      expect(url).toContain('hostAppName=attacker-page');
    });

    it('generates a default threadId when not given', () => {
      const url = buildChatspotUrl('12345', 'action');
      expect(url).toContain('copilotThreadId=exfil-');
    });
  });

  // ── capabilityMayContainData ──────────────────────────────
  describe('capabilityMayContainData', () => {
    it('returns false for short strings', () => {
      expect(capabilityMayContainData('short')).toBe(false);
    });

    it('returns false for long strings without keywords', () => {
      expect(capabilityMayContainData('a'.repeat(200))).toBe(false);
    });

    it('returns true for long strings containing "text"', () => {
      expect(capabilityMayContainData('a'.repeat(101) + 'text')).toBe(true);
    });

    it('returns true for long strings containing "content"', () => {
      expect(capabilityMayContainData('a'.repeat(101) + 'content')).toBe(true);
    });

    it('returns true for long strings containing "message"', () => {
      expect(capabilityMayContainData('a'.repeat(101) + 'message')).toBe(true);
    });

    it('returns true for long strings containing "response"', () => {
      expect(capabilityMayContainData('a'.repeat(101) + 'response')).toBe(true);
    });

    it('returns false for null/undefined', () => {
      expect(capabilityMayContainData(null)).toBe(false);
      expect(capabilityMayContainData(undefined)).toBe(false);
    });
  });
});
