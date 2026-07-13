import { differenceInCalendarMonths } from "date-fns";

const NEGOTIABLE_CATEGORIES = new Set(["Subscription", "Utility", "Insurance"]);
const LOYALTY_MONTHS_THRESHOLD = 12;

/**
 * "3 years loyal, no plan change — new customers typically pay 15-20% less.
 * Worth a call." Pure heuristic: long tenure + no recorded amount change
 * (createdAt vs updatedAt on the amount field isn't tracked separately, so
 * this uses createdAt age alone as a proxy — a deliberately conservative
 * signal, not a claim the bill is provably overpriced).
 * @param {object[]} commitments
 * @param {string} [todayStr]
 */
export function buildBillNegotiationScorecard(commitments, todayStr) {
  const today = todayStr ? new Date(`${todayStr}T12:00:00`) : new Date();
  const candidates = (commitments || []).filter(
    (c) => NEGOTIABLE_CATEGORIES.has(c.category) && c.repeatType === "monthly" && c.createdAt,
  );

  const rows = candidates
    .map((c) => {
      const created = new Date(c.createdAt);
      const monthsLoyal = Math.max(0, differenceInCalendarMonths(today, created));
      if (monthsLoyal < LOYALTY_MONTHS_THRESHOLD) return null;
      const amount = Math.max(0, Number(c.amount) || 0);
      const estimatedSavingsPct = 17; // midpoint of the commonly-cited 15-20% new-customer discount range
      const estimatedMonthlySavings = Math.round((amount * estimatedSavingsPct) / 100);
      return {
        id: c.id,
        name: c.name,
        category: c.category,
        monthsLoyal,
        amount,
        estimatedMonthlySavings,
        estimatedAnnualSavings: estimatedMonthlySavings * 12,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.estimatedAnnualSavings - a.estimatedAnnualSavings);

  return {
    rows,
    totalEstimatedAnnualSavings: rows.reduce((s, r) => s + r.estimatedAnnualSavings, 0),
  };
}
