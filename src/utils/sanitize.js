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
