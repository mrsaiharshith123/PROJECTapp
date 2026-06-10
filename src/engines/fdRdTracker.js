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
    const r = rate / 12;
    totalInvested = rd * months;
    if (r > 0) {
      maturityAmount = rd * (((1 + r) ** months - 1) / r) * (1 + r);
    } else {
      maturityAmount = totalInvested;
    }
  } else {
    totalInvested = p;
    maturityAmount = p * (1 + rate * (months / 12));
  }

  const interestEarned = Math.max(0, (maturityAmount ?? 0) - (totalInvested ?? 0));
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
