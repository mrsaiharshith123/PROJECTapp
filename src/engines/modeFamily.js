import { totalMonthlyBurden } from "./burden.js";

const FAMILY_CATEGORIES = new Set(["Insurance", "Rent", "SIP", "Loan", "EMI", "Subscription", "Utility"]);

/**
 * Household pressure grouped by common family expense types.
 */
export function computeFamilyPressure(commitments, income, getEffectiveStatus, dependents = 0) {
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const inc = Math.max(0, income || 0);
  const ratio = inc > 0 ? burden / inc : null;

  const grouped = {};
  for (const c of commitments) {
    if (getEffectiveStatus(c) === "paid") continue;
    const cat = FAMILY_CATEGORIES.has(c.category) ? c.category : "Other household";
    grouped[cat] = (grouped[cat] || 0) + Math.max(0, Number(c.remainingAmount ?? 0));
  }

  const heavyMonths = commitments
    .filter((c) => c.category === "Insurance" || c.repeatType === "yearly")
    .map((c) => ({ name: c.name, dueDate: c.dueDate, category: c.category }));

  let score = 75;
  if (ratio != null && ratio > 0.65) score -= 20;
  if (dependents >= 3) score -= 5;

  const insights = [];
  if (ratio != null && ratio > 0.55) {
    insights.push({
      id: "family-burden",
      tone: "warning",
      text: "Household bills use a large share of income — review shared commitments together.",
    });
  }
  if (dependents >= 2 && inc > 0 && burden / inc > 0.5) {
    insights.push({
      id: "family-dependency",
      tone: "info",
      text: "Family relies on a tight income-to-bills ratio — emergency planning matters.",
    });
  }

  return {
    householdBurden: Math.round(burden),
    committedPercent: ratio != null ? Math.round(ratio * 100) : null,
    grouped,
    heavyRenewals: heavyMonths.slice(0, 5),
    familyPressureScore: Math.max(0, Math.min(100, score)),
    insights,
  };
}
