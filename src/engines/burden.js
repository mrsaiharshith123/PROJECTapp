import { repeatIntervalMonths, normalizeRepeatType } from "../constants/repeatTypes.js";

/**
 * Approximate monthly cash pressure from a commitment (open items due now, not up next).
 */
export function monthlyBurdenForCommitment(c, getEffectiveStatusFn) {
  const eff = getEffectiveStatusFn(c);
  if (eff === "paid" || eff === "upnext") return 0;
  const amt = Math.max(0, Number(c.amount) || 0);
  const rem = Math.max(0, Number(c.remainingAmount ?? amt));
  const rt = normalizeRepeatType(c.repeatType);
  const interval = repeatIntervalMonths(rt);
  if (interval > 0) return amt / interval;
  return rem;
}

export function totalMonthlyBurden(commitments, getEffectiveStatusFn) {
  return commitments.reduce((s, c) => s + monthlyBurdenForCommitment(c, getEffectiveStatusFn), 0);
}

export function monthlyBurdenForDraft(draft, getEffectiveStatusFn) {
  return monthlyBurdenForCommitment(draft, getEffectiveStatusFn);
}
