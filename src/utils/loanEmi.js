import { calculateMonthlyEMI } from "./repayment/calculations.js";

/**
 * Standard reducing-balance EMI (monthly), rounded to the nearest rupee.
 * Delegates to the canonical amortization formula in repayment/calculations.js
 * — do not reimplement the EMI formula here or anywhere else.
 * @param {number} principal Loan amount after down payment
 * @param {number} annualRatePct Annual interest rate (e.g. 10.5)
 * @param {number} tenureMonths
 */
export function computeLoanEmi(principal, annualRatePct, tenureMonths) {
  const p = Math.max(0, Number(principal) || 0);
  if (p <= 0) return 0;
  return Math.round(calculateMonthlyEMI(p, annualRatePct, tenureMonths));
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
