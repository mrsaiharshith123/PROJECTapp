import { totalMonthlyBurden, monthlyBurdenForDraft } from "./burden.js";

/** @typedef {"safe" | "moderate_pressure" | "high_risk" | "dangerous"} AffordabilityTier */

/**
 * @param {number} income Monthly income (>=0)
 * @param {number} currentBurden Sum of monthly burden from existing open commitments
 * @param {number} proposedMonthlyBurden Additional burden from the new line item
 */
export function evaluateAffordability(income, currentBurden, proposedMonthlyBurden) {
  const inc = Math.max(0, income);
  const proposed = Math.max(0, proposedMonthlyBurden);
  const newTotal = Math.max(0, currentBurden) + proposed;
  const freeAfter = inc - newTotal;
  const ratio = inc > 0 ? newTotal / inc : newTotal > 0 ? 2 : 0;
  const burdenIncrease = proposed;

  /** @type {AffordabilityTier} */
  let tier = "safe";
  if (ratio > 0.75) tier = "dangerous";
  else if (ratio > 0.6) tier = "high_risk";
  else if (ratio > 0.4) tier = "moderate_pressure";

  const labels = {
    safe: "Safe",
    moderate_pressure: "Moderate pressure",
    high_risk: "High risk",
    dangerous: "Financially dangerous",
  };

  return {
    tier,
    label: labels[tier],
    income: inc,
    currentBurden: Math.max(0, currentBurden),
    proposedBurden: proposed,
    newTotalBurden: newTotal,
    freeMoneyAfter: freeAfter,
    committedPercent: inc > 0 ? Math.round(ratio * 100) : null,
    burdenIncrease,
  };
}

/**
 * Convenience: existing commitments + draft commitment object (with repeatType, amount, remainingAmount).
 */
export function evaluateNewCommitmentAffordability(
  income,
  commitments,
  draftCommitment,
  getEffectiveStatusFn
) {
  const current = totalMonthlyBurden(commitments, getEffectiveStatusFn);
  const proposed = monthlyBurdenForDraft(draftCommitment, getEffectiveStatusFn);
  return evaluateAffordability(income, current, proposed);
}

/** Semantic tone for UI mapping — no CSS classes. */
export function affordabilityTierTone(tier) {
  switch (tier) {
    case "safe":
      return "success";
    case "moderate_pressure":
      return "warning";
    case "high_risk":
      return "coral";
    case "dangerous":
      return "danger";
    default:
      return "neutral";
  }
}
