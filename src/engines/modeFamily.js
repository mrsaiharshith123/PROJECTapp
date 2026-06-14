import { totalMonthlyBurden } from "./burden.js";

const FAMILY_CATEGORIES = new Set([
  "Insurance",
  "Rent",
  "SIP",
  "Loan",
  "EMI",
  "Subscription",
  "Utility",
  "School",
  "Groceries",
]);

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
    grouped[cat] = (grouped[cat] || 0) + Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
  }

  const schoolOpen = commitments
    .filter((c) => c.category === "School" && getEffectiveStatus(c) !== "paid")
    .reduce((s, c) => s + Math.max(0, Number(c.remainingAmount ?? c.amount) || 0), 0);

  const heavyRenewals = commitments
    .filter(
      (c) =>
        getEffectiveStatus(c) !== "paid" &&
        (c.category === "Insurance" || c.repeatType === "yearly" || c.category === "School")
    )
    .map((c) => ({
      name: c.name,
      dueDate: c.dueDate,
      category: c.category,
      amount: Math.max(0, Number(c.remainingAmount ?? c.amount) || 0),
    }))
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .slice(0, 6);

  let score = 75;
  if (ratio != null && ratio > 0.65) score -= 20;
  else if (ratio != null && ratio > 0.55) score -= 12;
  if (dependents >= 3) score -= 5;
  if (schoolOpen > 0 && inc > 0 && schoolOpen / inc > 0.15) score -= 8;

  const insights = [];
  if (ratio != null && ratio > 0.55) {
    insights.push({ id: "family-burden", tone: "warning" });
  }
  if (dependents >= 2 && inc > 0 && burden / inc > 0.5) {
    insights.push({ id: "family-dependency", tone: "info" });
  }
  if (schoolOpen > 5000) {
    insights.push({
      id: "family-school",
      tone: "info",
      params: { amount: Math.round(schoolOpen) },
    });
  }
  if (heavyRenewals.length >= 2) {
    insights.push({
      id: "family-renewals",
      tone: "info",
      params: { count: heavyRenewals.length },
    });
  }

  const safetyLabel =
    score >= 70 ? "Comfortable" : score >= 50 ? "Moderate" : score >= 35 ? "Stretched" : "Fragile";

  return {
    householdBurden: Math.round(burden),
    committedPercent: ratio != null ? Math.round(ratio * 100) : null,
    grouped,
    schoolOpen: Math.round(schoolOpen),
    heavyRenewals,
    familyPressureScore: Math.max(0, Math.min(100, score)),
    safetyLabel,
    insights,
  };
}
