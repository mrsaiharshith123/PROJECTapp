import { normalizeRepeatType } from "../constants/repeatTypes.js";

const FIXED_CATEGORIES = new Set([
  "Rent",
  "Loan",
  "EMI",
  "Insurance",
  "SIP",
  "Chit Fund",
  "Vendor",
  "Payroll",
  "Tax",
  "School",
]);

function monthlyWeight(c, getEffectiveStatus) {
  if (getEffectiveStatus(c) === "paid") return 0;
  const amt = Number(c.amount) || 0;
  const rt = normalizeRepeatType(c.repeatType);
  if (rt === "yearly") return amt / 12;
  if (rt === "quarterly") return amt / 3;
  if (rt === "bimonthly") return amt / 2;
  if (rt === "every4months") return amt / 4;
  if (rt === "monthly") return amt;
  return Math.max(0, Number(c.remainingAmount ?? amt));
}

/**
 * Salary → fixed vs variable commitments → free cash.
 */
export function computeSalaryBreakdown(commitments, income, getEffectiveStatus) {
  const inc = Math.max(0, income || 0);
  let fixed = 0;
  let variable = 0;

  for (const c of commitments) {
    const w = monthlyWeight(c, getEffectiveStatus);
    if (w <= 0) continue;
    if (FIXED_CATEGORIES.has(c.category)) fixed += w;
    else variable += w;
  }

  const total = fixed + variable;
  const free = inc - total;
  const committedPercent = inc > 0 ? Math.round((total / inc) * 100) : null;
  const safeSpend = free > 0 ? Math.round(free * 0.7) : 0;

  return {
    income: inc,
    fixedMonthly: Math.round(fixed),
    variableMonthly: Math.round(variable),
    totalCommitted: Math.round(total),
    freeCash: Math.round(free),
    committedPercent,
    safeSpending: safeSpend,
    pressureImpact: committedPercent != null && committedPercent > 60 ? "high" : committedPercent > 45 ? "moderate" : "low",
  };
}
