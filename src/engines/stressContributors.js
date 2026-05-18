import { normalizeRepeatType, repeatIntervalMonths } from "../constants/repeatTypes.js";
import { effectiveAnnualRate } from "./payoffPriority.js";
import { chitInstallment } from "./chitFund.js";

function monthlyPressureWeight(c, getEffectiveStatus) {
  if (getEffectiveStatus(c) === "paid") return 0;
  if (c.category === "Chit Fund" && Number(c.chitValue) > 0 && Number(c.chitMonths) > 0) {
    const m = Math.min(Number(c.chitMonths), Math.max(1, Number(c.chitCurrentMonth) || 1));
    return chitInstallment(c.chitValue, c.chitMonths, m);
  }
  const amt = Number(c.amount) || 0;
  const interval = repeatIntervalMonths(normalizeRepeatType(c.repeatType));
  const base = interval > 0 ? amt / interval : Math.max(0, Number(c.remainingAmount ?? amt));
  const rate = effectiveAnnualRate(c);
  const interestBoost = 1 + Math.min(0.5, rate / 24);
  return base * interestBoost;
}

/**
 * Rank top sources of monthly financial pressure.
 */
export function rankStressContributors(commitments, getEffectiveStatus, limit = 5) {
  const rows = commitments
    .map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category || "Other",
      weight: monthlyPressureWeight(c, getEffectiveStatus),
      balance: Math.max(0, Number(c.remainingAmount ?? 0)),
    }))
    .filter((r) => r.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  const top = rows.slice(0, limit);
  const total = rows.reduce((s, r) => s + r.weight, 0);

  const byCategory = {};
  for (const r of rows) {
    byCategory[r.category] = (byCategory[r.category] || 0) + r.weight;
  }
  const categoryLoads = Object.entries(byCategory)
    .map(([category, weight]) => ({ category, weight, share: total > 0 ? weight / total : 0 }))
    .sort((a, b) => b.weight - a.weight);

  return {
    top,
    totalWeight: total,
    categoryLoads,
    subscriptionLoad: byCategory.Subscription || 0,
    emiLoad: (byCategory.EMI || 0) + (byCategory.Loan || 0),
    insuranceLoad: byCategory.Insurance || 0,
  };
}

export function stressContributorsInsight(rank) {
  if (!rank.top.length) return null;
  const names = rank.top.slice(0, 3).map((r) => r.name);
  return {
    id: "stress-contributors",
    tone: rank.emiLoad > rank.subscriptionLoad ? "warning" : "info",
    text: `Top pressure sources: ${names.join(", ")}.`,
  };
}
