/**
 * Approximate monthly cash pressure from a commitment (open items only).
 * — monthly repeat: full installment amount
 * — yearly: annual amount / 12
 * — none: remaining due (lump exposure until cleared)
 */
export function monthlyBurdenForCommitment(c, getEffectiveStatusFn) {
  if (getEffectiveStatusFn(c) === "paid") return 0;
  const amt = Math.max(0, Number(c.amount) || 0);
  const rem = Math.max(0, Number(c.remainingAmount ?? amt));
  const rt = c.repeatType || "none";
  if (rt === "monthly") return amt;
  if (rt === "yearly") return amt / 12;
  return rem;
}

export function totalMonthlyBurden(commitments, getEffectiveStatusFn) {
  return commitments.reduce((s, c) => s + monthlyBurdenForCommitment(c, getEffectiveStatusFn), 0);
}

export function monthlyBurdenForDraft(draft, getEffectiveStatusFn) {
  return monthlyBurdenForCommitment(draft, getEffectiveStatusFn);
}
