/**
 * Centralized repayment math (no UI).
 */

/** Simple interest: I = P * r * t (t in years). */
export function calculateSimpleInterest(principal, annualRatePercent, termMonths) {
  const P = Math.max(0, Number(principal) || 0);
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100;
  const months = Math.max(0, Number(termMonths) || 0);
  if (P <= 0 || months <= 0) return 0;
  return P * r * (months / 12);
}

/**
 * EMI amortization: M = P * [ r(1+r)^n ] / [ (1+r)^n – 1 ]
 * @param {number} principal P
 * @param {number} annualRatePercent annual %
 * @param {number} n installments
 */
export function calculateMonthlyEMI(principal, annualRatePercent, n) {
  const P = Math.max(0, Number(principal) || 0);
  const installments = Math.max(1, Math.floor(Number(n) || 1));
  const annual = Math.max(0, Number(annualRatePercent) || 0) / 100;
  if (P <= 0) return 0;
  if (annual === 0) return P / installments;
  const r = annual / 12;
  const pow = (1 + r) ** installments;
  return (P * r * pow) / (pow - 1);
}

export function calculateTotalPayableSimple(principal, annualRatePercent, termMonths) {
  const P = Math.max(0, Number(principal) || 0);
  const interest = calculateSimpleInterest(P, annualRatePercent, termMonths);
  return { totalPayable: P + interest, interestAmount: interest };
}

/** Late penalty: 0.1% per day on overdue installment (capped). */
export function calculateLatePenalty(installmentAmount, lateDays, dailyRate = 0.001) {
  const amt = Math.max(0, Number(installmentAmount) || 0);
  const days = Math.max(0, Math.floor(Number(lateDays) || 0));
  if (amt <= 0 || days <= 0) return 0;
  return Math.min(amt * 0.15, amt * dailyRate * days);
}

/** % of monthly income consumed by installment. */
export function calculateSalaryImpact(monthlyInstallment, monthlyIncome) {
  const inst = Math.max(0, Number(monthlyInstallment) || 0);
  const income = Math.max(0, Number(monthlyIncome) || 0);
  if (income <= 0) return inst > 0 ? 100 : 0;
  return Math.min(100, Math.round((inst / income) * 1000) / 10);
}

export function calculateInterestSaved(originalInterest, newInterest) {
  return Math.max(0, (Number(originalInterest) || 0) - (Number(newInterest) || 0));
}
