/**
 * Green → amber → red as spend approaches monthly salary.
 * @param {number} pctOfSalary 0–100+ (share of salary already spent)
 */
export function salarySpendBarColor(pctOfSalary) {
  const p = Math.min(100, Math.max(0, Number(pctOfSalary) || 0));
  if (p >= 100) return "#ef4444";
  const hue = 142 - (p / 100) * 142;
  const lightness = p > 80 ? 46 : 42;
  return `hsl(${hue.toFixed(0)}, 72%, ${lightness}%)`;
}

/**
 * @param {number} paidBills
 * @param {number} variableSpend
 */
export function computeOverallMonthlySpend(paidBills, variableSpend) {
  return Math.max(0, Math.round((Number(paidBills) || 0) + (Number(variableSpend) || 0)));
}

/**
 * @param {number} overallSpend
 * @param {number} monthlyIncome
 */
export function spendPctOfSalary(overallSpend, monthlyIncome) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  if (income <= 0) return 0;
  return Math.round((Math.max(0, Number(overallSpend) || 0) / income) * 1000) / 10;
}
