import Decimal from "decimal.js";
import { repeatIntervalMonths, normalizeRepeatType } from "../constants/repeatTypes.js";
import { safeNum } from "./_guard.js";

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
  if (interval > 0) return new Decimal(amt).div(interval).toNumber();
  return rem;
}

export function totalMonthlyBurden(commitments, getEffectiveStatusFn) {
  const raw = (commitments || []).reduce(
    (s, c) => new Decimal(s).plus(monthlyBurdenForCommitment(c, getEffectiveStatusFn)).toNumber(),
    0,
  );
  return safeNum(raw, 0);
}

export function monthlyBurdenForDraft(draft, getEffectiveStatusFn) {
  return monthlyBurdenForCommitment(draft, getEffectiveStatusFn);
}
