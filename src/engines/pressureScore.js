import { totalMonthlyBurden } from "./burden.js";
import { commitmentToIncomeRatio } from "./pressureAdvanced.js";

/**
 * Canonical 0–100 pressure score (higher = more stressed).
 * Combines burden/income ratio, overdue penalty, and snapshot trend.
 */
export function computeCanonicalPressureScore({
  commitments,
  income,
  getEffectiveStatus,
  monthlySnapshots = [],
}) {
  const inc = Math.max(0, income || 0);
  const ratio = commitmentToIncomeRatio(commitments, inc, getEffectiveStatus);
  let score = inc > 0 ? Math.round(ratio * 100) : ratio > 0 ? 85 : 0;

  const overdue = commitments.filter((c) => getEffectiveStatus(c) === "overdue").length;
  score += overdue * 8;

  const sorted = [...(monthlySnapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
  if (sorted.length >= 2) {
    const prev = sorted[sorted.length - 2];
    const last = sorted[sorted.length - 1];
    if (last.pressureScore > prev.pressureScore + 5) {
      score += 5;
    }
  }

  return Math.min(100, Math.max(0, score));
}

export function pressureScoreLabel(score) {
  if (score <= 35) {
    return { level: "healthy", label: "Safe", hint: "Room to breathe — keep building your buffer." };
  }
  if (score <= 55) {
    return { level: "moderate", label: "Moderate", hint: "Manageable, but watch new EMIs and subs." };
  }
  if (score <= 70) {
    return { level: "stressed", label: "Tight", hint: "Bills take a large share — prioritize dues." };
  }
  if (score <= 85) {
    return { level: "risky", label: "Risky", hint: "Small shocks could hurt — avoid new long commitments." };
  }
  return { level: "dangerous", label: "Critical", hint: "High stress zone — focus on overdue and essentials." };
}

export function pressureScoreBadgeClass(level) {
  switch (level) {
    case "healthy":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "moderate":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "stressed":
      return "bg-orange-100 text-orange-900 border-orange-200";
    case "risky":
      return "bg-orange-100 text-orange-950 border-orange-300 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800";
    case "dangerous":
      return "bg-red-100 text-red-900 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function freeMoneyAfterBurden(commitments, income, getEffectiveStatus) {
  const inc = Math.max(0, income || 0);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const openRemaining = commitments.reduce((s, c) => {
    if (getEffectiveStatus(c) === "paid") return s;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
  return {
    monthlyBurden: burden,
    openRemaining,
    freeMoney: inc - burden,
    committedPercent: inc > 0 ? Math.round((burden / inc) * 100) : null,
  };
}

/**
 * What-if free cash if income drops (same open dues / burden model).
 * @param {number[]} cuts — e.g. [0.1, 0.2] for −10% and −20%
 * @returns {{ cutPercent: number, hypotheticalIncome: number, freeMoney: number }[]}
 */
export function buildIncomeSensitivityRows(commitments, income, getEffectiveStatus, cuts = [0.1, 0.2]) {
  const inc = Math.max(0, income || 0);
  if (inc <= 0) return [];
  return cuts.map((cut) => {
    const hypotheticalIncome = Math.max(0, Math.round(inc * (1 - cut)));
    const freeMoney = Math.round(freeMoneyAfterBurden(commitments, hypotheticalIncome, getEffectiveStatus).freeMoney);
    return { cutPercent: Math.round(cut * 100), hypotheticalIncome, freeMoney };
  });
}
