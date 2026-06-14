const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** @returns {string} 6-char invite code (no ambiguous 0/O/1/I). */
export function generateHouseholdInviteCode() {
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

/**
 * Max people who can join a household room (set when the room is created).
 * @param {{ householdMemberLimit?: number }} settings
 */
export function householdMemberLimit(settings) {
  const stored = Math.floor(Number(settings?.householdMemberLimit) || 0);
  if (stored >= 2) return Math.min(20, stored);
  return 2;
}

/** @param {string} message */
export function mapHouseholdCloudError(message) {
  const msg = String(message || "");
  if (/does not exist|PGRST205|42P01|schema cache/i.test(msg)) return "migration_missing";
  if (/not_configured/i.test(msg)) return "not_configured";
  if (/full|member limit|household_full/i.test(msg)) return "household_full";
  return "create_failed";
}
