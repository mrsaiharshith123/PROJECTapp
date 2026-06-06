import { totalMonthlyBurden } from "./burden.js";
import { computePaymentMonthStreak } from "../utils/profileStats.js";
import { computeControlScore } from "../utils/profileStats.js";

/** @typedef {"excellent" | "good" | "caution" | "risky"} HealthLevel */

function isOpenBill(commitment, getEffectiveStatus) {
  const status = getEffectiveStatus(commitment);
  return status !== "paid" && status !== "skipped";
}

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

  const list = commitments || [];
  const overdue = list.filter((c) => getEffectiveStatus(c) === "overdue").length;
  const openBills = list.filter((c) => isOpenBill(c, getEffectiveStatus));

  if (openBills.length === 0 && overdue === 0) {
    return {
      score: 100,
      level: "excellent",
      label: "Excellent",
      openRemaining: openRemaining ?? 0,
    };
  }

  let score = 100;
  score -= overdue * 12;

  const ratio = income > 0 ? totalMonthlyBurden(list, getEffectiveStatus) / income : 0;
  score -= Math.min(45, Math.round(ratio * 50));

  if (income > 0 && freeMoneyAfterBurden < 5000) score -= 10;
  if (freeMoneyAfterBurden < 0) score -= 15;

  const streak = computePaymentMonthStreak(list, lendings);
  score += Math.min(5, streak);

  const control = computeControlScore(list, getEffectiveStatus);
  score -= Math.round((100 - control) * 0.25);

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
