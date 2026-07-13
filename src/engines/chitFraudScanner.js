/**
 * Rule-based chit fund fraud red-flag scanner — the part of "Chit Fund
 * Registration Verifier" that doesn't need an external lookup. Real fraud
 * cases (thousands of victims, tens of crores lost in documented cases)
 * share recognizable patterns: promised guaranteed returns (illegal under
 * the Prize Chits and Money Circulation Schemes (Banning) Act, 1978 — a
 * genuine chit fund's payout is a bid discount, never a guaranteed return),
 * cash-only collection (no paper trail), and a missing/implausible state
 * registration number. This flags those from what the user has already
 * entered — no AI or network call required for these three checks.
 */

const GUARANTEED_RETURN_PATTERN = /guarantee(d)?.{0,25}(return|profit|interest)|assured.{0,25}(return|profit)|fixed.{0,25}(monthly.{0,10})?(return|profit)/i;
const CASH_ONLY_PATTERN = /cash\s*only|no\s*receipt|only\s*cash|cash\s*collection\s*only/i;
const NO_REGISTRATION_PATTERN = /no\s*registration|not\s*registered|unregistered/i;

/**
 * @param {object} chitCommitment
 * @param {string} [chitCommitment.notes]
 * @param {string} [chitCommitment.chitRegistrationNumber]
 * @param {string} [chitCommitment.name]
 */
export function scanChitFundRedFlags(chitCommitment) {
  const text = `${chitCommitment?.notes || ""} ${chitCommitment?.name || ""}`;
  /** @type {{ id: string, severity: 'critical'|'high'|'medium' }[]} */
  const flags = [];

  if (GUARANTEED_RETURN_PATTERN.test(text)) {
    flags.push({ id: "guaranteed-return", severity: "critical" });
  }
  if (CASH_ONLY_PATTERN.test(text)) {
    flags.push({ id: "cash-only", severity: "high" });
  }
  if (NO_REGISTRATION_PATTERN.test(text) || !String(chitCommitment?.chitRegistrationNumber || "").trim()) {
    flags.push({ id: "no-registration-number", severity: "medium" });
  }

  // A plausible Indian chit-fund registration number is a state code plus a
  // numeric/alphanumeric registry id (format varies by state registrar) —
  // this is a shape sanity check, not a real verification. Genuinely tiny
  // numbers or obviously placeholder text ("N/A", "pending", "123") are
  // worth flagging even before any external lookup.
  const regNo = String(chitCommitment?.chitRegistrationNumber || "").trim();
  if (regNo && (/^(n\/?a|pending|test|123+|xxx+)$/i.test(regNo) || regNo.length < 4)) {
    flags.push({ id: "implausible-registration-number", severity: "medium" });
  }

  const hasCritical = flags.some((f) => f.severity === "critical");
  const riskLevel = hasCritical ? "critical" : flags.length >= 2 ? "high" : flags.length === 1 ? "medium" : "low";

  return { flags, riskLevel, needsExternalVerification: flags.some((f) => f.id === "no-registration-number" || f.id === "implausible-registration-number") };
}
