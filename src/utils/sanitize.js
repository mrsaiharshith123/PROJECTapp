/**
 * Strip HTML tags from user input before storing or embedding in exports.
 */
export function sanitizeText(input, maxLength = 500) {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]))
    .trim()
    .slice(0, maxLength);
}

export function sanitizeAmount(input) {
  const n = Number(String(input).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function sanitizeName(input) {
  return sanitizeText(input, 100);
}

export function sanitizeNote(input) {
  return sanitizeText(input, 1000);
}

/**
 * Last 10 digits of a phone number, ignoring spaces/dashes/country code —
 * lets "+91 98765 43210" and "9876543210" compare as the same number.
 */
export function phoneLast10(input) {
  const digits = String(input || "").replace(/\D/g, "");
  return digits.slice(-10);
}

/** True when two phone numbers refer to the same 10-digit Indian mobile number. */
export function phoneNumbersMatch(a, b) {
  const da = phoneLast10(a);
  const db = phoneLast10(b);
  return da.length === 10 && da === db;
}
