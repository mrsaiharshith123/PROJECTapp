/**
 * Standard reducing-balance EMI (monthly).
 * @param {number} principal Loan amount after down payment
 * @param {number} annualRatePct Annual interest rate (e.g. 10.5)
 * @param {number} tenureMonths
 */
export function computeLoanEmi(principal, annualRatePct, tenureMonths) {
  const p = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Math.floor(Number(tenureMonths) || 1));
  const r = Math.max(0, Number(annualRatePct) || 0) / 100 / 12;
  if (p <= 0) return 0;
  if (r <= 0) return Math.round(p / n);
  const factor = Math.pow(1 + r, n);
  return Math.round((p * r * factor) / (factor - 1));
}

/** Total repaid over tenure at fixed EMI. */
export function totalRepaymentFromEmi(emi, tenureMonths) {
  return Math.round(Math.max(0, Number(emi) || 0) * Math.max(1, Math.floor(Number(tenureMonths) || 1)));
}

/** Interest portion of total repayment. */
export function interestFromLoan(principal, emi, tenureMonths) {
  const total = totalRepaymentFromEmi(emi, tenureMonths);
  return Math.max(0, total - Math.max(0, Number(principal) || 0));
}
