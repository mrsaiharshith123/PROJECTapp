import Decimal from "decimal.js";
/**
 * Fixed deposit (FD) and recurring deposit (RD) maturity projections.
 * @param {{ principal: number, annualRate: number, tenureMonths: number, isRd?: boolean, monthlyDeposit?: number }} params
 */
export function computeFdRdProjection({
  principal = 0,
  annualRate = 6.5,
  tenureMonths = 12,
  isRd = false,
  monthlyDeposit = 0,
}) {
  const rate = Math.max(0, Number(annualRate) || 0) / 100;
  const months = Math.max(1, Math.floor(Number(tenureMonths) || 1));
  const p = Math.max(0, Number(principal) || 0);
  const rd = Math.max(0, Number(monthlyDeposit) || 0);

  let maturityAmount;
  let totalInvested;

  if (isRd && rd > 0) {
    const r = new Decimal(rate).div(12);
    totalInvested = new Decimal(rd).times(months).toNumber();
    if (r.gt(0)) {
      const onePlusR = r.plus(1);
      maturityAmount = new Decimal(rd)
        .times(onePlusR.pow(months).minus(1).div(r))
        .times(onePlusR)
        .toNumber();
    } else {
      maturityAmount = totalInvested;
    }
  } else {
    totalInvested = p;
    maturityAmount = new Decimal(p)
      .times(new Decimal(1).plus(new Decimal(rate).times(months).div(12)))
      .toNumber();
  }

  const interestEarned = Math.max(0, new Decimal(maturityAmount ?? 0).minus(totalInvested ?? 0).toNumber());
  const narrativeLines = [];
  if (isRd) {
    narrativeLines.push(`RD of ₹${Math.round(rd).toLocaleString("en-IN")}/month for ${months} months.`);
  } else {
    narrativeLines.push(`FD principal ₹${Math.round(p).toLocaleString("en-IN")} for ${months} months at ${annualRate}% p.a.`);
  }
  if (interestEarned > 0) {
    narrativeLines.push(`Estimated interest: ₹${Math.round(interestEarned).toLocaleString("en-IN")}.`);
  }

  return {
    maturityAmount: Math.round(maturityAmount ?? 0),
    totalInvested: Math.round(totalInvested ?? 0),
    interestEarned: Math.round(interestEarned),
    tenureMonths: months,
    annualRate,
    isRd,
    narrativeLines,
  };
}

/**
 * Months until maturity from start date.
 * @param {string} startDate YYYY-MM-DD
 * @param {number} tenureMonths
 * @param {string} todayStr YYYY-MM-DD
 */
export function monthsUntilMaturity(startDate, tenureMonths, todayStr) {
  if (!startDate || !todayStr) return Math.max(0, tenureMonths);
  try {
    const start = new Date(`${startDate}T12:00:00`);
    const today = new Date(`${todayStr}T12:00:00`);
    const elapsed =
      (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    return Math.max(0, Math.floor(Number(tenureMonths) || 0) - elapsed);
  } catch {
    return Math.max(0, tenureMonths);
  }
}
