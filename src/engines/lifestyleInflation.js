import { recurringGrowthSeries } from "./analyticsSeries.js";

/**
 * Detect growth in recurring spend from snapshots + live recurring bills.
 */
export function detectLifestyleInflation(commitments, getEffectiveStatus) {
  const series = recurringGrowthSeries(commitments, getEffectiveStatus, 9);
  if (series.length < 2) {
    return {
      hasTrend: false,
      growthPercent: null,
      subscriptionGrowthPercent: null,
      message: null,
      insights: [],
    };
  }

  const first = series.find((s) => s.amount > 0);
  const last = [...series].reverse().find((s) => s.amount > 0);
  if (!first || !last || first === last) {
    return { hasTrend: false, growthPercent: null, subscriptionGrowthPercent: null, message: null, insights: [] };
  }

  const growthPercent = first.amount > 0 ? Math.round(((last.amount - first.amount) / first.amount) * 100) : null;

  const subs = commitments.filter(
    (c) => c.category === "Subscription" && getEffectiveStatus(c) !== "paid"
  );
  const subMonthly = subs.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const insights = [];
  let message = null;
  if (growthPercent != null && growthPercent >= 15) {
    message = `Recurring expenses increased about ${growthPercent}% over recent months.`;
    insights.push({
      id: "lifestyle-inflation",
      tone: growthPercent >= 30 ? "warning" : "info",
      text: message,
    });
  }
  if (subMonthly >= 2000 && growthPercent != null && growthPercent >= 20) {
    insights.push({
      id: "subscription-growth",
      tone: "warning",
      text: "Subscription spending may be climbing — review renewals and duplicates.",
    });
  }

  return {
    hasTrend: growthPercent != null,
    growthPercent,
    subscriptionGrowthPercent: growthPercent,
    message,
    insights,
    series,
  };
}
