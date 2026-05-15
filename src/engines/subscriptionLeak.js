import { differenceInCalendarDays, parseISO } from "date-fns";
import { todayYmd } from "../utils/dates.js";

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
  const insights = [];
  if (subs.length >= 4) {
    insights.push(`You track ${subs.length} subscriptions—review for duplicates or unused plans.`);
  }
  if (annualized > 0) {
    insights.push(`Yearly subscription-style exposure ≈ ₹${Math.round(annualized).toLocaleString()}.`);
  }
  if (lowPriorityRecurring >= 500) {
    insights.push(
      `Low-priority recurring entertainment/tools add ~₹${Math.round(lowPriorityRecurring).toLocaleString()}/mo.`
    );
  }
  for (const c of subs) {
    const trialEnd = c.trialEnd ? String(c.trialEnd).slice(0, 10) : "";
    if (!trialEnd) continue;
    try {
      const days = differenceInCalendarDays(parseISO(`${trialEnd}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
      if (days >= 0 && days <= 14) {
        insights.push(`${c.name} trial ends in ${days} day${days === 1 ? "" : "s"} (${trialEnd})—cancel or budget.`);
      }
    } catch {
      /* ignore bad dates */
    }
  }
  return {
    count: subs.length,
    monthlyEquivalent: monthly,
    yearlyExtrapolation: annualized,
    insights,
  };
}
