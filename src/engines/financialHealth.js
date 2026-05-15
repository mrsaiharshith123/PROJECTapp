import { totalMonthlyBurden } from "./burden.js";
import { computePaymentMonthStreak } from "../utils/profileStats.js";
import { computeControlScore } from "../utils/profileStats.js";

/** @typedef {"excellent" | "good" | "caution" | "risky"} HealthLevel */

/**
 * Proprietary 0–100 financial health score (not a credit score).
 */
export function computeFinancialHealthScore(input) {
  const {
    commitments,
    lendings,
    income,
    getEffectiveStatus,
    openRemaining,
    freeMoneyAfterBurden,
  } = input;

  let score = 72;
  const overdue = commitments.filter((c) => getEffectiveStatus(c) === "overdue").length;
  score -= overdue * 12;

  const ratio = income > 0 ? totalMonthlyBurden(commitments, getEffectiveStatus) / income : 0;
  score -= Math.min(35, Math.round(ratio * 40));

  if (freeMoneyAfterBurden < 5000 && income > 0) score -= 10;
  if (freeMoneyAfterBurden < 0) score -= 15;

  const streak = computePaymentMonthStreak(commitments, lendings);
  score += Math.min(10, streak * 2);

  const control = computeControlScore(commitments, getEffectiveStatus);
  score += Math.round((control - 70) * 0.15);

  score = Math.max(0, Math.min(100, Math.round(score)));

  /** @type {HealthLevel} */
  let level;
  if (score >= 82) level = "excellent";
  else if (score >= 65) level = "good";
  else if (score >= 45) level = "caution";
  else level = "risky";

  return {
    score,
    level,
    label: level.charAt(0).toUpperCase() + level.slice(1),
    openRemaining,
  };
}

export function healthLevelBadgeClass(level) {
  switch (level) {
    case "excellent":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "good":
      return "bg-sky-100 text-sky-900 border-sky-200";
    case "caution":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "risky":
      return "bg-red-100 text-red-900 border-red-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
}
