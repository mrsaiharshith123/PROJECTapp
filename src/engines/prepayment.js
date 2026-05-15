/**
 * Reducing-balance loan simulation (monthly rests).
 * @param {object} params
 * @param {number} params.principalOutstanding — current principal
 * @param {number} params.annualRatePercent — nominal annual % (e.g. 10.5)
 * @param {number} params.scheduledEmi — base EMI (principal+interest)
 * @param {number} params.extraMonthly — additional principal payment each month
 */
export function simulatePrepayment({ principalOutstanding, annualRatePercent, scheduledEmi, extraMonthly }) {
  const P0 = Math.max(0, Number(principalOutstanding) || 0);
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100 / 12;
  const emi = Math.max(0, Number(scheduledEmi) || 0);
  const extra = Math.max(0, Number(extraMonthly) || 0);

  function run(extraPay) {
    let bal = P0;
    let months = 0;
    let interestPaid = 0;
    const maxMonths = 600;
    while (bal > 0.01 && months < maxMonths) {
      months += 1;
      const interest = bal * r;
      interestPaid += interest;
      const towardPrincipal = Math.min(bal, emi - interest + extraPay);
      if (towardPrincipal <= 0 && emi + extraPay <= interest) break;
      bal = Math.max(0, bal - towardPrincipal);
    }
    return { months, interestPaid, finalBalance: bal };
  }

  const baseline = run(0);
  const accelerated = run(extra);

  const monthsSaved = Math.max(0, baseline.months - accelerated.months);
  const interestSaved = Math.max(0, baseline.interestPaid - accelerated.interestPaid);

  return {
    baselineMonths: baseline.months,
    acceleratedMonths: accelerated.months,
    monthsSaved,
    baselineInterest: baseline.interestPaid,
    acceleratedInterest: accelerated.interestPaid,
    interestSaved,
  };
}

/**
 * EMI from principal, annual rate, tenure months (standard annuity).
 */
export function computeEmiFromPrincipal(principal, annualRatePercent, tenureMonths) {
  const P = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Math.floor(Number(tenureMonths) || 1));
  const r = Math.max(0, Number(annualRatePercent) || 0) / 100 / 12;
  if (r === 0) return P / n;
  const factor = Math.pow(1 + r, n);
  return (P * r * factor) / (factor - 1);
}
