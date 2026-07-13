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

/**
 * FD ladder analysis — flags when multiple FDs all mature in the same
 * narrow window (bad liquidity: a lump sum reinvestment decision forced all
 * at once) vs staggered maturities (steady access to cash without breaking
 * any single deposit early).
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} fdEntries
 * @param {string} todayStr
 * @param {number} [clusterWindowMonths]
 */
export function analyzeFdLadder(fdEntries, todayStr, clusterWindowMonths = 2) {
  const withMaturity = (fdEntries || [])
    .filter((e) => e.categoryId === "fd" && !e.hidden && e.maturityDate)
    .map((e) => {
      const months = monthsUntilMaturity(e.purchaseYear ? `${e.purchaseYear}-${String(e.purchaseMonth || 1).padStart(2, "0")}-01` : todayStr, 0, todayStr);
      return { id: e.id, name: e.name, value: Math.max(0, Number(e.value) || 0), maturityDate: e.maturityDate, monthsUntil: months };
    })
    .sort((a, b) => String(a.maturityDate).localeCompare(String(b.maturityDate)));

  if (withMaturity.length < 2) {
    return { fds: withMaturity, clusters: [], isLaddered: withMaturity.length <= 1, staggerScore: withMaturity.length === 1 ? 100 : 0 };
  }

  /** @type {{ maturityMonth: string, fds: typeof withMaturity, totalValue: number }[]} */
  const clusters = [];
  for (const fd of withMaturity) {
    const monthKey = String(fd.maturityDate).slice(0, 7);
    let cluster = clusters.find((c) => {
      const [cy, cm] = c.maturityMonth.split("-").map(Number);
      const [fy, fm] = monthKey.split("-").map(Number);
      return Math.abs((cy - fy) * 12 + (cm - fm)) <= clusterWindowMonths;
    });
    if (!cluster) {
      cluster = { maturityMonth: monthKey, fds: [], totalValue: 0 };
      clusters.push(cluster);
    }
    cluster.fds.push(fd);
    cluster.totalValue += fd.value;
  }

  const totalValue = withMaturity.reduce((s, f) => s + f.value, 0);
  const largestCluster = [...clusters].sort((a, b) => b.totalValue - a.totalValue)[0];
  const largestClusterPct = totalValue > 0 ? Math.round((largestCluster.totalValue / totalValue) * 100) : 0;
  const isLaddered = clusters.length === withMaturity.length; // every FD in its own window
  const staggerScore = Math.max(0, Math.round(100 - largestClusterPct));

  return {
    fds: withMaturity,
    clusters: clusters.filter((c) => c.fds.length > 1),
    isLaddered,
    staggerScore,
    largestClusterPct,
  };
}

/**
 * Reinvestment risk — an FD locked in at a rate meaningfully below current
 * market average is worth flagging before it auto-renews at the old rate.
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} fdEntries
 * @param {number} currentMarketRatePct
 * @param {string} todayStr
 * @param {number} [warnWithinDays]
 */
export function scanFdReinvestmentRisk(fdEntries, currentMarketRatePct, todayStr, warnWithinDays = 30) {
  const market = Math.max(0, Number(currentMarketRatePct) || 0);
  const today = new Date(`${todayStr}T12:00:00`);

  const flagged = (fdEntries || [])
    .filter((e) => e.categoryId === "fd" && !e.hidden && e.maturityDate && Number(e.interestRate) > 0)
    .map((e) => {
      let daysToMaturity = null;
      try {
        daysToMaturity = Math.round((new Date(`${String(e.maturityDate).slice(0, 10)}T12:00:00`).getTime() - today.getTime()) / 86400000);
      } catch {
        /* leave daysToMaturity null — filtered out below */
      }
      const rateGap = market - Number(e.interestRate);
      const value = Math.max(0, Number(e.value) || 0);
      const estimatedAnnualImprovement = rateGap > 0 ? Math.round((value * rateGap) / 100) : 0;
      return { id: e.id, name: e.name, value, currentRate: Number(e.interestRate), marketRate: market, rateGap, daysToMaturity, estimatedAnnualImprovement };
    })
    .filter((r) => r.daysToMaturity != null && r.daysToMaturity >= 0 && r.daysToMaturity <= warnWithinDays && r.rateGap >= 0.5)
    .sort((a, b) => b.estimatedAnnualImprovement - a.estimatedAnnualImprovement);

  return { flagged, totalEstimatedAnnualImprovement: flagged.reduce((s, r) => s + r.estimatedAnnualImprovement, 0) };
}
