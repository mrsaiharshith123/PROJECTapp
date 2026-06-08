import { format, subDays, parseISO, getDate, getDaysInMonth } from "date-fns";
import { detectLifestyleInflation } from "./lifestyleInflation.js";
import { buildDueHeatmap } from "./analyticsSeries.js";
import { sumDailySpendsInRange, dailySpendByLifeCategory, dailySpendByMerchant } from "../utils/dailySpends.js";
import { groupCommitmentsByMerchant } from "../utils/merchantNormalize.js";

function analyzeDailySpendFlow(dailySpends, todayStr) {
  const start7 = format(subDays(parseISO(`${todayStr}T12:00:00`), 6), "yyyy-MM-dd");
  const start30 = format(subDays(parseISO(`${todayStr}T12:00:00`), 29), "yyyy-MM-dd");
  const prev30Start = format(subDays(parseISO(`${todayStr}T12:00:00`), 59), "yyyy-MM-dd");
  const prev30End = format(subDays(parseISO(`${todayStr}T12:00:00`), 30), "yyyy-MM-dd");

  const weekTotal = sumDailySpendsInRange(dailySpends, start7, todayStr);
  const monthTotal = sumDailySpendsInRange(dailySpends, start30, todayStr);
  const prevMonthTotal = sumDailySpendsInRange(dailySpends, prev30Start, prev30End);

  const weekByLife = dailySpendByLifeCategory(dailySpends, start7, todayStr);
  const weekByMerchant = dailySpendByMerchant(dailySpends, start7, todayStr);
  const lifestyleWeek = weekByLife.find((x) => x.lifeCategory === "lifestyle")?.amount || 0;
  const survivalWeek = weekByLife.find((x) => x.lifeCategory === "survival")?.amount || 0;
  const count = (dailySpends || []).filter((s) => s.date >= start7 && s.date <= todayStr).length;

  const medicalWeek = (dailySpends || [])
    .filter((s) => s.date >= start7 && s.date <= todayStr && (s.spendType === "medical" || /apollo|hospital|pharma/i.test(s.label)))
    .reduce((s, x) => s + x.amount, 0);

  const deliveryWeek = weekByMerchant
    .filter((m) => /swiggy|zomato|food_delivery/.test(m.merchantId) || /swiggy|zomato/i.test(m.label))
    .reduce((s, m) => s + m.amount, 0);

  return {
    hasData: count > 0 || monthTotal > 0,
    weekTotal,
    monthTotal,
    prevMonthTotal,
    weekByLife,
    weekByMerchant,
    lifestyleWeek,
    survivalWeek,
    medicalWeek,
    deliveryWeek,
    entryCount: count,
    lifestyleShare: weekTotal > 0 ? lifestyleWeek / weekTotal : 0,
    monthGrowthPercent:
      prevMonthTotal > 0 ? Math.round(((monthTotal - prevMonthTotal) / prevMonthTotal) * 100) : 0,
  };
}

function detectMerchantPressure(commitments, dailySpends, todayStr) {
  const flow = analyzeDailySpendFlow(dailySpends, todayStr);
  const fromBills = groupCommitmentsByMerchant(commitments);
  const insights = [];

  if (flow.deliveryWeek >= 800 && flow.lifestyleShare >= 0.35) {
    insights.push({
      id: "txn-delivery-dependency",
      tone: "caution",
      text: "Food delivery spending is a large share this week — dependency can grow quietly.",
    });
  }
  if (flow.medicalWeek >= 1500) {
    insights.push({
      id: "txn-health-spend-week",
      tone: "caution",
      text: "Health-related spends rose this week — survival costs can tighten short-term cash.",
    });
  }
  if (flow.monthGrowthPercent >= 20 && flow.monthTotal >= 2000) {
    insights.push({
      id: "txn-discretionary-rise",
      tone: "caution",
      text: "Daily discretionary spending increased compared to the previous month.",
    });
  }
  const lifestyleBill = fromBills.find((m) => m.profile.lifeCategory === "lifestyle" && m.monthly >= 800);
  if (lifestyleBill && flow.lifestyleWeek >= 1000) {
    insights.push({
      id: "txn-lifestyle-stack",
      tone: "warning",
      text: `Recurring ${lifestyleBill.profile.label} costs stack with recent lifestyle spends — review overlap.`,
    });
  }
  if (flow.entryCount >= 5 && flow.weekTotal >= 500 && flow.weekTotal / flow.entryCount < 400) {
    insights.push({
      id: "txn-small-leaks",
      tone: "info",
      text: "Several small purchases this week may be slowly reducing monthly flexibility.",
    });
  }

  return { flow, merchantInsights: insights };
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
    dailySpends = [],
    todayStr,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    burdenRatio = 0,
  } = input;

  const lifestyle = detectLifestyleInflation(commitments, getEffectiveStatus);
  const rhythm = detectSalaryWeekPhase(todayStr, settings.salaryCreditDay);
  const heatmap = buildDueHeatmap(commitments, lendings, todayStr, getEffectiveStatus, getEffectiveLendingStatus);
  const unsafeWeeks = detectUnsafeWeeks(heatmap);
  const merchant = detectMerchantPressure(commitments, dailySpends, todayStr);

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
    return "An upcoming week has dense due dates — treat it as a higher-risk cash window.";
  }
  if (patterns.overlap) {
    return "Several obligations overlap in the next week — plan cash before they stack.";
  }
  if (patterns.merchant?.flow?.lifestyleShare >= 0.5 && patterns.merchant.flow.hasData) {
    return "Recent daily spends lean lifestyle-heavy — discretionary flow may be reducing flexibility.";
  }
  return null;
}

/**
 * Behavioral transaction insights — integrates with existing insight shape { id, tone, text }.
 * @param {object} input
 */
function dailySpendBudgetInsight(input) {
  const { todayStr, burdenRatio = 0, monthSummary } = input;
  const guidance = monthSummary?.spendGuidance;
  if (!guidance || !todayStr) return null;

  const spent = monthSummary?.spentThisMonth || 0;

  if ((guidance.isTight || burdenRatio >= 0.5) && guidance.dailyLifestyleCap > 0) {
    return {
      id: "txn-daily-budget-cap",
      tone: guidance.isTight ? "warning" : "caution",
      text: `Bills use ~${guidance.billsPressurePercent}% of income — aim for about ₹${guidance.dailyLifestyleCap.toLocaleString("en-IN")}/day on lifestyle spends for the rest of the month.`,
    };
  }
  if (spent > 0 && guidance.dailyTotalCap > 0) {
    return {
      id: "txn-daily-budget-room",
      tone: "info",
      text: `After dues, about ₹${guidance.dailyTotalCap.toLocaleString("en-IN")}/day remains flexible for the rest of this month.`,
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
      id: "txn-recurring-growth",
      tone: patterns.lifestyle.growthPercent >= 30 ? "warning" : "caution",
      text:
        patterns.lifestyle.growthPercent >= 20
          ? "Recurring optional spending is slowly increasing — small repeats may reduce flexibility."
          : `Recurring obligations grew about ${patterns.lifestyle.growthPercent}% over recent months.`,
    });
  }
  if (patterns.highPressure && patterns.merchant.flow.lifestyleShare >= 0.2 && patterns.merchant.flow.hasData) {
    insights.push({
      id: "txn-under-pressure",
      tone: "warning",
      text: "Discretionary daily spending continues while obligation pressure is already elevated.",
    });
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
  const { insights, patterns } = buildTransactionInsights(input);
  const feed = insights.slice(0, limit).map((ins) => ({
    id: `feed-${ins.id}`,
    tone: ins.tone,
    text: ins.text,
  }));

  if (patterns.merchant.flow.deliveryWeek >= 500 && feed.length < limit) {
    feed.push({
      id: "feed-restaurant-week",
      tone: "neutral",
      text: "Restaurant and delivery spending increased this week.",
    });
  }
  if (patterns.merchant.flow.medicalWeek >= 1000 && feed.length < limit) {
    feed.push({
      id: "feed-medical-month",
      tone: "caution",
      text: "Medical expenses rose compared to your recent weekly baseline.",
    });
  }

  const seen = new Set();
  return feed
    .filter((item) => {
      if (seen.has(item.text)) return false;
      seen.add(item.text);
      return true;
    })
    .slice(0, limit);
}

/** Map to extended insights merge in useCommitIntel. */
export function transactionInsightsForMerge(input) {
  return buildTransactionInsights(input).insights;
}
