import { totalMonthlyBurden } from "./burden.js";

/** @typedef {"healthy" | "moderate" | "stressed" | "dangerous"} PressureSeverity */

export function commitmentToIncomeRatio(commitments, income, getEffectiveStatusFn) {
  const inc = Math.max(0, income || 0);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatusFn);
  if (inc <= 0) return burden > 0 ? 1.5 : 0;
  return burden / inc;
}

export function monthlyPressureScore(commitments, income, getEffectiveStatusFn) {
  const ratio = commitmentToIncomeRatio(commitments, income, getEffectiveStatusFn);
  const score = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return score;
}

export function pressureSeverity(commitments, income, getEffectiveStatusFn) {
  const ratio = commitmentToIncomeRatio(commitments, income, getEffectiveStatusFn);
  /** @type {PressureSeverity} */
  let level = "healthy";
  if (ratio > 0.75) level = "dangerous";
  else if (ratio > 0.55) level = "stressed";
  else if (ratio > 0.35) level = "moderate";
  return { level, ratio, label: severityLabel(level) };
}

function severityLabel(level) {
  switch (level) {
    case "healthy":
      return "Healthy";
    case "moderate":
      return "Moderate";
    case "stressed":
      return "Stressed";
    case "dangerous":
      return "Dangerous";
    default:
      return level;
  }
}

export function severityBadgeClass(level) {
  switch (level) {
    case "healthy":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "moderate":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "stressed":
      return "bg-orange-100 text-orange-900 border-orange-200";
    case "dangerous":
      return "bg-red-100 text-red-900 border-red-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

/**
 * Yearly burden estimate = monthly burden * 12 (recurring view; excludes one-off lump timing).
 */
export function yearlyBurdenEstimate(commitments, getEffectiveStatusFn) {
  return totalMonthlyBurden(commitments, getEffectiveStatusFn) * 12;
}
