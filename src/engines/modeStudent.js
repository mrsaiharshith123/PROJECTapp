import { subscriptionLeakReport } from "./subscriptionLeak.js";

/**
 * Simple student budget signals — subscriptions, burn rate, afford check.
 */
export function computeStudentBudget(commitments, settings, getEffectiveStatus, todayStr, intel) {
  const subs = commitments.filter((c) => c.category === "Subscription" && getEffectiveStatus(c) !== "paid");
  const subMonthly = subs.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const income = Math.max(0, Number(settings.monthlyIncome) || 0);
  const leak = subscriptionLeakReport(commitments, getEffectiveStatus, todayStr);

  const insights = [...(leak.insights || [])].map((text, i) => ({
    id: `student-leak-${i}`,
    tone: "warning",
    text,
  }));

  if (subMonthly > 1500) {
    insights.push({
      id: "student-subs-high",
      tone: "warning",
      text: `Subscriptions total about ₹${Math.round(subMonthly).toLocaleString()}/mo — trim unused plans.`,
    });
  }
  if (intel.openRemaining > income * 0.4 && income > 0) {
    insights.push({
      id: "student-debt-pressure",
      tone: "warning",
      text: "Open balances are high vs income — avoid new BNPL or impulse buys.",
    });
  }

  return {
    subscriptionCount: subs.length,
    subscriptionMonthly: Math.round(subMonthly),
    openRemaining: Math.round(intel.openRemaining),
    insights,
  };
}
