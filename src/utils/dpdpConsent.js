export const CONSENT_VERSION = 1;
export const CONSENT_KEY = "ct_dpdp_consent_v1";

/** @returns {boolean} @deprecated Unused — consent is recorded at sign-up via recordConsent only. */
export function hasConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const o = JSON.parse(raw);
    return o?.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

/** @param {string} [userId] */
export function recordConsent(userId = "anonymous") {
  const record = {
    version: CONSENT_VERSION,
    givenAt: new Date().toISOString(),
    userId,
    purposes: ["financial_tracking", "cloud_sync", "notifications"],
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
  return record;
}

/** @returns {object | null} @deprecated Unused — no UI reads the stored consent record. */
export function getConsentRecord() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @deprecated Unused — no revoke-consent flow in the product. */
export function revokeConsent() {
  localStorage.removeItem(CONSENT_KEY);
}
