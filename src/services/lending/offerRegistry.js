import {
  generateInviteCode,
  isValidInviteCode,
  normalizeInviteCode,
} from "../../utils/inviteCode.js";

const STORAGE_PREFIX = "perovo_lend_code_";
const OFFER_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** @returns {string} 6-char offer code */
export function generateOfferCode() {
  return generateInviteCode();
}

/**
 * Persist a lending offer locally, keyed by random code.
 * @param {Record<string, unknown>} offer
 * @returns {string} offer code
 */
export function saveLendingOffer(offer) {
  let code = offer.offerCode ? normalizeInviteCode(String(offer.offerCode)) : generateOfferCode();
  let attempts = 0;
  while (loadLendingOffer(code) && attempts < 12) {
    code = generateOfferCode();
    attempts += 1;
  }
  const payload = { ...offer, offerCode: code, offerId: code, savedAt: Date.now() };
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${code}`, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
  return code;
}

/**
 * @param {string} rawCode
 * @returns {Record<string, unknown> | null}
 */
export function loadLendingOffer(rawCode) {
  const code = normalizeInviteCode(rawCode);
  if (!isValidInviteCode(code)) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${code}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    if (Date.now() - Number(data.savedAt || 0) > OFFER_TTL_MS) {
      localStorage.removeItem(`${STORAGE_PREFIX}${code}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export { isValidInviteCode, normalizeInviteCode };
