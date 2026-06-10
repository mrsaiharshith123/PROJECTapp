import { differenceInCalendarDays, parseISO } from "date-fns";
import { todayYmd } from "../utils/dates.js";

/** Emotional / necessity tag for subscription rows. */
export function classifySubscription(c) {
  const name = String(c.name || "").toLowerCase();
  if (c.priority === "critical" || c.priority === "high") return "Essential";
  if (/netflix|prime|spotify|hotstar|gaming|entertainment/.test(name)) return "Luxury";
  if (/cloud|office|google|microsoft|zoom|slack|notion/.test(name)) return "Useful";
  if (c.priority === "low") return "Optional";
  if (c.amount >= 1500) return "Useful";
  return "Optional";
}

export function subscriptionLeakReport(commitments, getEffectiveStatusFn, todayStr = todayYmd()) {
  const subs = commitments.filter((c) => c.category === "Subscription");
  let monthly = 0;
  let yearlyCost = 0;
  let lowPriorityRecurring = 0;
  for (const c of subs) {
    if (getEffectiveStatusFn(c) === "paid") continue;
    const amt = Number(c.amount) || 0;
    if (c.repeatType === "monthly") {
      monthly += amt;
      if (c.priority === "low") lowPriorityRecurring += amt;
    } else if (c.repeatType === "yearly") {
      yearlyCost += amt;
      monthly += amt / 12;
    } else {
      monthly += Math.max(0, Number(c.remainingAmount ?? amt));
    }
  }
  const annualized = monthly * 12 + yearlyCost;
  const classified = subs
    .filter((c) => getEffectiveStatusFn(c) !== "paid")
    .map((c) => ({ name: c.name, tag: classifySubscription(c), monthly: Number(c.amount) || 0 }));
  const luxury = classified.filter((r) => r.tag === "Luxury" || r.tag === "Optional");
  const luxuryMonthly = luxury.reduce((s, r) => s + r.monthly, 0);

  const insights = [];
  if (subs.length >= 4) {
    insights.push({ id: "sub-leak-many", tone: "info", params: { count: subs.length } });
  }
  if (annualized > 0) {
    insights.push({
      id: "sub-leak-annual",
      tone: "info",
      params: { amount: Math.round(annualized).toLocaleString("en-IN") },
    });
  }
  if (luxuryMonthly >= 800) {
    insights.push({
      id: "sub-leak-luxury",
      tone: "warning",
      params: { amount: Math.round(luxuryMonthly).toLocaleString("en-IN") },
    });
  }
  if (lowPriorityRecurring >= 500) {
    insights.push({
      id: "sub-leak-low-priority",
      tone: "info",
      params: { amount: Math.round(lowPriorityRecurring).toLocaleString("en-IN") },
    });
  }
  for (const c of subs) {
    const trialEnd = c.trialEnd ? String(c.trialEnd).slice(0, 10) : "";
    if (!trialEnd) continue;
    try {
      const days = differenceInCalendarDays(parseISO(`${trialEnd}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
      if (days >= 0 && days <= 14) {
        insights.push({
          id: "sub-leak-trial",
          tone: "caution",
          params: { name: c.name, days, date: trialEnd },
        });
      }
    } catch {
      /* ignore bad dates */
    }
  }
  return {
    count: subs.length,
    monthlyEquivalent: monthly,
    yearlyExtrapolation: annualized,
    classified: classified.slice(0, 8),
    insights,
  };
}
