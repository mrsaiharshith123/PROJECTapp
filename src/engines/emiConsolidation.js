import { differenceInMonths, parseISO } from "date-fns";

const EMI_CATEGORIES = new Set(["EMI", "Loan", "Credit Card", "BNPL"]);

/** @param {object[]} commitments @param {(c: object) => string} getEffectiveStatus */
export function buildEmiConsolidationPlan(commitments, getEffectiveStatus) {
  const emis = commitments.filter(
    (c) =>
      EMI_CATEGORIES.has(c.category) &&
      getEffectiveStatus(c) !== "paid" &&
      c.endDate,
  );
  if (emis.length < 2) return null;

  const sorted = [...emis].sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)));
  const plan = sorted.map((c, i) => ({
    name: c.name,
    amount: Number(c.amount) || 0,
    endDate: c.endDate,
    monthsRemaining: Math.max(0, differenceInMonths(parseISO(`${c.endDate}T12:00:00`), new Date())),
    order: i + 1,
  }));

  const totalRelief = sorted.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const firstRelief = plan[0];

  return {
    plan,
    totalRelief,
    firstRelief,
    insightKey: "analytics.emiConsolidation.insight",
    insightParams: {
      months: firstRelief.monthsRemaining,
      name: firstRelief.name,
      amount: firstRelief.amount,
      total: totalRelief,
    },
  };
}
