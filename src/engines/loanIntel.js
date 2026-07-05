/**
 * Loan / liability amortisation context.
 */

/**
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {{ monthlyIncome?: number }} settings
 */
export function analyzeLoan(entry, settings = {}) {
  const emi = Number(entry.emi) || 0;
  const rate = Number(entry.interestRate) || 0;
  const outstanding = Number(entry.value) || 0;
  const originalAmount = Number(entry.originalLoanAmount) || Number(entry.purchasePrice) || outstanding;
  const monthlyIncome = Number(settings.monthlyIncome) || 0;

  const monthlyInterest =
    outstanding > 0 && rate > 0 ? Math.round(outstanding * (rate / 100 / 12)) : null;

  const monthsLeft =
    emi > 0 && rate > 0 && outstanding > 0
      ? Math.ceil(
          -Math.log(1 - (outstanding * rate) / 100 / 12 / emi) / Math.log(1 + rate / 100 / 12),
        )
      : null;

  const totalInterestLeft =
    emi > 0 && monthsLeft != null ? Math.round(emi * monthsLeft - outstanding) : null;

  const emiBurdenPct =
    monthlyIncome > 0 && emi > 0 ? Math.round((emi / monthlyIncome) * 1000) / 10 : null;

  const prepayBenefit =
    totalInterestLeft != null ? Math.round(totalInterestLeft * 0.3) : null;

  const rbiLimit = 50;
  let burdenVerdictKey = null;
  if (emiBurdenPct != null) {
    if (emiBurdenPct > rbiLimit) burdenVerdictKey = "wealthDetail.loan.burdenHigh";
    else if (emiBurdenPct > 35) burdenVerdictKey = "wealthDetail.loan.burdenModerate";
    else burdenVerdictKey = "wealthDetail.loan.burdenSafe";
  }

  return {
    emi,
    rate,
    outstanding,
    originalAmount,
    monthlyInterest,
    monthsLeft,
    totalInterestLeft,
    emiBurdenPct,
    prepayBenefit,
    burdenVerdictKey,
    rbiLimit,
    repaidAmount:
      originalAmount > outstanding ? Math.round(originalAmount - outstanding) : null,
    repaidPct:
      originalAmount > outstanding
        ? Math.round((1 - outstanding / originalAmount) * 1000) / 10
        : null,
  };
}
