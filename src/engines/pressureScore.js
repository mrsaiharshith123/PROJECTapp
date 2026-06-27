import { format, parseISO, getDate, getDaysInMonth, differenceInCalendarDays } from "date-fns";
import { totalMonthlyBurden } from "./burden.js";
import { commitmentToIncomeRatio } from "./pressureAdvanced.js";
import { totalMonthlyLendingBurden } from "./lendingMonthCash.js";
import { sumDailySpendsInRange } from "../utils/dailySpends.js";
import { safeScore } from "./_guard.js";

const HOUSING_CATEGORIES = new Set(["Rent", "EMI", "Loan"]);
const VEHICLE_CATEGORIES = new Set(["EMI", "Loan", "Transport"]);

/**
 * @param {object[]} commitments
 * @param {(c: object) => string} getEffectiveStatus
 */
export function totalOverdueAmount(commitments, getEffectiveStatus) {
  let sum = 0;
  for (const c of commitments || []) {
    if (getEffectiveStatus(c) !== "overdue") continue;
    sum += Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
  }
  return sum;
}

/**
 * Weeks (Mon-start label) where 3+ open commitments share a 7-day window.
 * @returns {{ weekStart: string, count: number, commitmentIds: string[] }[]}
 */
export function detectDueClusters(commitments, getEffectiveStatus, _todayStr) {
  const open = (commitments || []).filter((c) => {
    const st = getEffectiveStatus(c);
    return st !== "paid" && st !== "skipped" && c.dueDate;
  });
  if (open.length < 3) return [];

  /** @type {Map<string, { weekStart: string, count: number, commitmentIds: Set<string> }>} */
  const clusters = new Map();

  for (const c of open) {
    try {
      const due = parseISO(`${c.dueDate}T12:00:00`);
      const weekStart = format(due, "yyyy-MM-dd");
      const key = weekStart;
      if (!clusters.has(key)) {
        clusters.set(key, { weekStart, count: 0, commitmentIds: new Set() });
      }
      const row = clusters.get(key);
      const id = String(c.id || c.name || due);
      if (!row.commitmentIds.has(id)) {
        row.commitmentIds.add(id);
        row.count += 1;
      }

      for (const other of open) {
        if (other === c || !other.dueDate) continue;
        const otherDue = parseISO(`${other.dueDate}T12:00:00`);
        const days = Math.abs(differenceInCalendarDays(otherDue, due));
        if (days <= 6) {
          const oid = String(other.id || other.name || otherDue);
          if (!row.commitmentIds.has(oid)) {
            row.commitmentIds.add(oid);
            row.count += 1;
          }
        }
      }
    } catch {
      /* skip invalid dates */
    }
  }

  return [...clusters.values()]
    .filter((c) => c.count >= 3)
    .map((c) => ({
      weekStart: c.weekStart,
      count: c.count,
      commitmentIds: [...c.commitmentIds],
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Simple linear regression slope on y values (x = 0, 1, 2, …).
 * @param {number[]} ys
 */
export function linearRegressionSlope(ys) {
  const n = ys.length;
  if (n < 2) return 0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += ys[i];
    sumXY += i * ys[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * @param {object[]} commitments
 * @param {(c: object) => string} getEffectiveStatus
 * @param {number} income
 */
export function buildPressureDrivers(commitments, getEffectiveStatus, income) {
  const inc = Math.max(0, income || 0);
  /** @type {Map<string, { category: string, amount: number, overdueAmount: number }>} */
  const byCat = new Map();

  for (const c of commitments || []) {
    const st = getEffectiveStatus(c);
    if (st === "paid" || st === "skipped") continue;
    const cat = c.category || "Other";
    const amt = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
    if (!byCat.has(cat)) byCat.set(cat, { category: cat, amount: 0, overdueAmount: 0 });
    const row = byCat.get(cat);
    row.amount += amt;
    if (st === "overdue") row.overdueAmount += amt;
  }

  return [...byCat.values()]
    .map((r) => ({
      category: r.category,
      amount: Math.round(r.amount),
      overdueAmount: Math.round(r.overdueAmount),
      shareOfIncome: inc > 0 ? Math.round((r.amount / inc) * 100) : null,
      points: Math.round(r.overdueAmount / Math.max(1, inc) * 30) + (inc > 0 ? Math.round((r.amount / inc) * 10) : 0),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);
}

/**
 * @param {object} analysis
 */
export function buildPressureNarratives(analysis) {
  const lines = [];
  const drivers = analysis.pressureDrivers || [];

  if (drivers.length > 0) {
    const cats = drivers.slice(0, 3).map((d) => d.category);
    const hasHousing = cats.some((c) => HOUSING_CATEGORIES.has(c));
    const hasVehicle = cats.some((c) => VEHICLE_CATEGORIES.has(c));
    if (hasHousing && hasVehicle) {
      lines.push("Pressure heavily driven by housing and vehicle commitments.");
    } else if (hasHousing) {
      lines.push("Pressure heavily driven by housing commitments.");
    } else if (drivers[0]) {
      lines.push(`Pressure is most influenced by ${drivers[0].category} commitments.`);
    }
  }

  if (analysis.clusterWeeks?.length > 0) {
    lines.push("Multiple obligations are clustering in the same calendar week.");
  }

  if (analysis.trendDirection === "improving") {
    lines.push("Pressure improving over the last 90 days.");
  } else if (analysis.trendDirection === "worsening") {
    lines.push("Pressure has been rising over recent months.");
  }

  if (analysis.overdueBurdenRatio > 0.15) {
    lines.push("Overdue amounts represent a significant share of monthly income.");
  }

  return lines;
}

/**
 * Full pressure analysis — canonical intelligence output.
 */
export function computePressureAnalysis({
  commitments = [],
  income,
  getEffectiveStatus = () => "pending",
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

  const overdueAmt = totalOverdueAmount(commitments, getEffectiveStatus);
  const overdueBurdenRatio = inc > 0 ? overdueAmt / inc : overdueAmt > 0 ? 1 : 0;
  const overduePenalty = inc > 0 ? Math.min(25, Math.round(overdueBurdenRatio * 30)) : overdueAmt > 0 ? 25 : 0;
  score += overduePenalty;

  const clusterWeeks = detectDueClusters(commitments, getEffectiveStatus, todayStr);
  if (clusterWeeks.length > 0) score += 5;

  if (inc > 0 && todayStr && dailySpends?.length) {
    const monthKey = format(parseISO(`${todayStr}T12:00:00`), "yyyy-MM");
    const spent = sumDailySpendsInRange(dailySpends, `${monthKey}-01`, todayStr);
    const dayOfMonth = Math.max(1, getDate(parseISO(`${todayStr}T12:00:00`)));
    const daysInMonth = getDaysInMonth(parseISO(`${todayStr}T12:00:00`));
    const projected = (spent / dayOfMonth) * daysInMonth;
    if (projected / inc > 0.35) score += 5;
    else if (projected / inc > 0.25) score += 2;
  }

  const sorted = [...(monthlySnapshots || [])]
    .filter((s) => s.pressureScore != null)
    .sort((a, b) => a.month.localeCompare(b.month));
  const last3 = sorted.slice(-3).map((s) => Number(s.pressureScore) || 0);
  const pressureTrendSlope = linearRegressionSlope(last3);
  let trendDirection = "stable";
  if (last3.length >= 2) {
    if (pressureTrendSlope > 2) trendDirection = "worsening";
    else if (pressureTrendSlope < -2) trendDirection = "improving";
  }

  score = safeScore(score);
  const pressureDrivers = buildPressureDrivers(commitments, getEffectiveStatus, inc);

  const analysis = {
    score,
    overdueBurdenRatio: Math.round(overdueBurdenRatio * 1000) / 1000,
    overduePenalty,
    clusterWeeks,
    pressureDrivers,
    pressureTrendSlope: Math.round(pressureTrendSlope * 10) / 10,
    trendDirection,
    narrativeLines: [],
  };
  analysis.narrativeLines = buildPressureNarratives(analysis);
  return analysis;
}

/**
 * Canonical 0–100 pressure score (higher = more stressed).
 */
export function computeCanonicalPressureScore(params) {
  return safeScore(computePressureAnalysis(params).score);
}

/** Semantic tone for badges — engines return tokens only. */
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
