import { getDate, getDaysInMonth, parseISO } from "date-fns";
import { detectLifestyleInflation } from "./lifestyleInflation.js";
import { buildDueHeatmap } from "./analyticsSeries.js";
import { groupCommitmentsByMerchant } from "../utils/merchantNormalize.js";

function detectMerchantPressure(commitments) {
  const fromBills = groupCommitmentsByMerchant(commitments);
  const insights = [];
  const lifestyleBill = fromBills.find((m) => m.profile.lifeCategory === "lifestyle" && m.monthly >= 800);
  if (lifestyleBill) {
    insights.push({
      id: "txn-lifestyle-stack",
      tone: "warning",
      params: { merchant: lifestyleBill.profile.label },
    });
  }
  return { merchantInsights: insights };
}

function detectSalaryWeekPhase(todayStr, salaryCreditDay) {
  const day = getDate(parseISO(`${todayStr}T12:00:00`));
  const creditDay = Math.min(28, Math.max(1, Number(salaryCreditDay) || 1));
  const daysSinceCredit =
    day >= creditDay ? day - creditDay : getDaysInMonth(parseISO(`${todayStr}T12:00:00`)) - creditDay + day;
  if (daysSinceCredit <= 7) return { phase: "salary_week", label: "Salary week" };
  if (day >= getDaysInMonth(parseISO(`${todayStr}T12:00:00`)) - 6) return { phase: "end_of_month", label: "End-of-month" };
  return { phase: "mid_month", label: "Mid-month" };
}

function detectUnsafeWeeks(heatmap) {
  const avg = heatmap.reduce((s, b) => s + b.count, 0) / Math.max(1, heatmap.length);
  return heatmap
    .map((b, i) => ({ ...b, weekIndex: i, unsafe: b.count >= 3 || (avg > 0 && b.count >= avg * 1.8) }))
    .filter((b) => b.unsafe);
}

function detectTransactionPatterns(input) {
  const {
    commitments = [],
    lendings = [],
    settings = {},
    todayStr,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    burdenRatio = 0,
  } = input;

  const lifestyle = detectLifestyleInflation(commitments, getEffectiveStatus);
  const rhythm = detectSalaryWeekPhase(todayStr, settings.salaryCreditDay);
  const heatmap = buildDueHeatmap(commitments, lendings, todayStr, getEffectiveStatus, getEffectiveLendingStatus);
  const unsafeWeeks = detectUnsafeWeeks(heatmap);
  const merchant = detectMerchantPressure(commitments);

  const thisWeekCount = heatmap[0]?.count || 0;
  const overlap = thisWeekCount >= 3 || (heatmap[0]?.count >= 2 && heatmap[1]?.count >= 2);

  return {
    lifestyle,
    rhythm,
    heatmap,
    unsafeWeeks,
    overlap,
    thisWeekCount,
    merchant,
    highPressure: burdenRatio >= 0.65,
    endOfMonthStress: rhythm.phase === "end_of_month" && thisWeekCount >= 2,
  };
}

function transactionRhythmNote(patterns) {
  if (!patterns) return null;
  if (patterns.unsafeWeeks?.length > 0) {
    return { id: "txn-rhythm-unsafe", tone: "caution" };
  }
  if (patterns.overlap) {
    return { id: "txn-rhythm-overlap", tone: "caution" };
  }
  return null;
}

function dailySpendBudgetInsight(input) {
  const { todayStr, burdenRatio = 0, monthSummary } = input;
  const guidance = monthSummary?.spendGuidance;
  if (!guidance || !todayStr) return null;

  const spent = monthSummary?.spentThisMonth || 0;

  if ((guidance.isTight || burdenRatio >= 0.5) && guidance.dailyLifestyleCap > 0) {
    return {
      id: "txn-daily-budget-cap",
      tone: guidance.isTight ? "warning" : "caution",
      params: {
        percent: guidance.billsPressurePercent,
        cap: `₹${guidance.dailyLifestyleCap.toLocaleString("en-IN")}`,
      },
    };
  }
  if (spent > 0 && guidance.dailyTotalCap > 0) {
    return {
      id: "txn-daily-budget-room",
      tone: "info",
      params: { amount: `₹${guidance.dailyTotalCap.toLocaleString("en-IN")}` },
    };
  }
  return null;
}

export function buildTransactionInsights(input) {
  const patterns = detectTransactionPatterns(input);
  const insights = [];

  const budgetInsight = dailySpendBudgetInsight(input);
  if (budgetInsight) insights.push(budgetInsight);

  if (patterns.lifestyle.hasTrend && patterns.lifestyle.growthPercent >= 15) {
    insights.push({
      id:
        patterns.lifestyle.growthPercent >= 20 ? "txn-recurring-growth-high" : "txn-recurring-growth",
      tone: patterns.lifestyle.growthPercent >= 30 ? "warning" : "caution",
      params: { percent: patterns.lifestyle.growthPercent },
    });
  }
  if (patterns.highPressure) {
    insights.push({ id: "txn-under-pressure", tone: "warning" });
  }

  for (const mi of patterns.merchant.merchantInsights) {
    insights.push(mi);
  }

  insights.sort((a, b) => {
    const rank = { warning: 3, caution: 2, critical: 4, info: 1, neutral: 0 };
    return (rank[b.tone] || 0) - (rank[a.tone] || 0);
  });

  return { insights, patterns, rhythmNote: transactionRhythmNote(patterns) };
}

/** Lightweight life-feed lines (not a transaction list). */
export function buildTransactionLifeFeed(input, limit = 4) {
  const { insights } = buildTransactionInsights(input);
  const feed = insights.slice(0, limit).map((ins) => ({
    ...ins,
    id: ins.id?.startsWith("feed-") ? ins.id : `feed-${ins.id}`,
  }));

  const seen = new Set();
  return feed
    .filter((item) => {
      const key = item.id || "";
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

/** Map to extended insights merge in useCommitIntel. */
export function transactionInsightsForMerge(input) {
  return buildTransactionInsights(input).insights;
}
