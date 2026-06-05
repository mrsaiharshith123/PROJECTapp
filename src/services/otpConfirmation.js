/**
 * Declared confirmation — NOT Aadhaar eSign.
 * For court-grade digital signatures, integrate Leegality Schedule II eSign in production.
 */

/** @param {string} phone @param {string|number} timestamp */
export function generateConfirmationRef(phone, timestamp) {
  const raw = `${String(phone || "").slice(-4)}-${timestamp}`;
  try {
    return btoa(raw).replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase();
  } catch {
    return raw.slice(0, 6).toUpperCase();
  }
}

/**
 * @param {{ displayName?: string, phoneNumber?: string }} settings
 * @param {"lender"|"borrower"} role
 */
export function buildConfirmationRecord(settings, role) {
  const now = new Date().toISOString();
  const phone = settings.phoneNumber || "";
  return {
    confirmedAt: now,
    role,
    displayName: settings.displayName || "",
    phone,
    ref: generateConfirmationRef(phone, Date.now()),
  };
}

/** @param {string} phone @param {string} enteredLast4 */
export function verifyPhoneLast4(phone, enteredLast4) {
  const digits = String(phone || "").replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return last4.length === 4 && last4 === String(enteredLast4 || "").replace(/\D/g, "").slice(-4);
}
