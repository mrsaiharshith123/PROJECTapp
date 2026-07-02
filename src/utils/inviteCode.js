const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** @returns {string} 6-char code (no ambiguous 0/O/1/I). */
export function generateInviteCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/** @param {string} raw */
export function normalizeInviteCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

/** @param {string} code */
export function isValidInviteCode(code) {
  return /^[A-Z2-9]{6}$/.test(normalizeInviteCode(code));
}
