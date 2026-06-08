import { format, parseISO, getDate, getDaysInMonth } from "date-fns";
import { totalMonthlyBurden } from "./burden.js";
import { commitmentToIncomeRatio } from "./pressureAdvanced.js";
import { totalMonthlyLendingBurden } from "./lendingMonthCash.js";
import { sumDailySpendsInRange } from "../utils/dailySpends.js";

/**
 * Canonical 0–100 pressure score (higher = more stressed).
 * Combines burden/income ratio, overdue penalty, lending burden, spend pace, and snapshot trend.
 */
export function computeCanonicalPressureScore({
  commitments,
  income,
  getEffectiveStatus,
  monthlySnapshots = [],
  lendings = [],
  getEffectiveLendingStatus = undefined,
  todayStr = "",
  dailySpends = [],
}) {
  const inc = Math.max(0, income || 0);
  let ratio = commitmentToIncomeRatio(commitments, inc, getEffectiveStatus);
  if (inc > 0 && lendings?.length && getEffectiveLendingStatus && todayStr) {
    ratio += totalMonthlyLendingBurden(lendings, getEffectiveLendingStatus, todayStr) / inc;
  }
  let score = inc > 0 ? Math.round(ratio * 100) : ratio > 0 ? 85 : 0;

  const overdue = commitments.filter((c) => getEffectiveStatus(c) === "overdue").length;
  score += overdue * 8;

  if (inc > 0 && todayStr && dailySpends?.length) {
    const monthKey = format(parseISO(`${todayStr}T12:00:00`), "yyyy-MM");
    const spent = sumDailySpendsInRange(dailySpends, `${monthKey}-01`, todayStr);
    const dayOfMonth = Math.max(1, getDate(parseISO(`${todayStr}T12:00:00`)));
    const daysInMonth = getDaysInMonth(parseISO(`${todayStr}T12:00:00`));
    const projected = (spent / dayOfMonth) * daysInMonth;
    if (projected / inc > 0.35) score += 5;
    else if (projected / inc > 0.25) score += 2;
  }

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

/** Colour tone for badges — 71–80 uses coral (act soon). */
export function pressureScoreTone(score) {
  if (score <= 40) return "success";
  if (score <= 60) return "info";
  if (score <= 70) return "warning";
  if (score <= 80) return "coral";
  return "danger";
}

export function pressureScoreLabel(score) {
  const tone = pressureScoreTone(score);
  if (score <= 40) {
    return { level: "healthy", tone, label: "Safe", hint: "Adequate margin remains — continue building reserves." };
  }
  if (score <= 60) {
    return { level: "moderate", tone, label: "Moderate", hint: "Manageable, but monitor new EMIs and subscriptions." };
  }
  if (score <= 70) {
    return { level: "stressed", tone, label: "Constrained", hint: "Bills consume a large share of income — prioritize dues." };
  }
  if (score <= 80) {
    return { level: "risky", tone, label: "Elevated", hint: "Limited buffer for unexpected costs — defer new long commitments." };
  }
  return { level: "dangerous", tone, label: "Critical", hint: "Pressure is high — address overdue items and essentials first." };
}

export function pressureScoreBadgeClass(levelOrTone) {
  const levelToTone = {
    healthy: "success",
    moderate: "info",
    stressed: "warning",
    risky: "coral",
    dangerous: "danger",
  };
  const tone = levelToTone[levelOrTone] || levelOrTone;
  switch (tone) {
    case "success":
      return "ct-status ct-status-success";
    case "info":
      return "ct-status ct-status-info";
    case "warning":
      return "ct-status ct-status-warning";
    case "coral":
      return "ct-badge ct-badge-coral";
    case "teal":
      return "ct-badge ct-badge-teal";
    case "danger":
      return "ct-status ct-status-danger";
    default:
      return "ct-status ct-status-neutral";
  }
}

/**
 * @param {{ lendings?: object[], getEffectiveLendingStatus?: (l: object, todayStr?: string) => string, todayStr?: string }} [options]
 */
export function freeMoneyAfterBurden(commitments, income, getEffectiveStatus, options = {}) {
  const { lendings = [], getEffectiveLendingStatus, todayStr } = options;
  const inc = Math.max(0, income || 0);
  let burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  if (lendings.length > 0 && getEffectiveLendingStatus && todayStr) {
    burden += totalMonthlyLendingBurden(lendings, getEffectiveLendingStatus, todayStr);
  }
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
