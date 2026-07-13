/**
 * Mutual fund / SIP holding analysis.
 */

const NIFTY_10YR = 13.5;
const INFLATION = 6;
const ELSS_LOCK_YEARS = 3;

/**
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {{ monthlyIncome?: number, taxSlab?: number }} settings
 */
export function analyzeMutualFund(entry, settings = {}) {
  const currentValue = Number(entry.value) || 0;
  const investedAmount = Number(entry.purchasePrice) || 0;
  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : null;
  const monthlyIncome = Number(settings.monthlyIncome) || 0;
  const fundType = entry.fundSubType || "equity";

  const yearsHeld = purchaseYear
    ? (Date.now() - new Date(purchaseYear, 0, 1).getTime()) / (365.25 * 24 * 3600 * 1000)
    : null;

  const absoluteReturn =
    investedAmount > 0
      ? Math.round(((currentValue - investedAmount) / investedAmount) * 1000) / 10
      : null;

  const cagr =
    investedAmount > 0 && currentValue > 0 && yearsHeld != null && yearsHeld > 0
      ? Math.round(((currentValue / investedAmount) ** (1 / yearsHeld) - 1) * 1000) / 10
      : null;

  const isEquity = ["equity", "elss", "index"].includes(fundType);
  const isLongTerm =
    yearsHeld != null && (isEquity ? yearsHeld >= 1 : yearsHeld >= 3);
  const gain = investedAmount > 0 ? currentValue - investedAmount : null;
  const LTCG_EXEMPTION = isEquity ? 100000 : 0;
  const taxableGain = gain != null && gain > 0 ? Math.max(0, gain - LTCG_EXEMPTION) : 0;
  const taxRate = isEquity
    ? isLongTerm
      ? 0.1
      : 0.15
    : isLongTerm
      ? 0.2
      : Number(settings.taxSlab) || 0.3;
  const taxIfRedeemed = taxableGain > 0 ? Math.round(taxableGain * taxRate) : 0;
  const netProceeds = currentValue - taxIfRedeemed;

  const elssLockRemaining =
    fundType === "elss" && purchaseYear != null
      ? Math.max(0, ELSS_LOCK_YEARS - (yearsHeld || 0))
      : null;

  const realReturn = cagr != null ? Math.round((cagr - INFLATION) * 10) / 10 : null;
  const vsBenchmark = cagr != null ? Math.round((cagr - NIFTY_10YR) * 10) / 10 : null;

  const monthlySip = Number(entry.monthlySip) || 0;
  const sipBurdenPct =
    monthlyIncome > 0 && monthlySip > 0
      ? Math.round((monthlySip / monthlyIncome) * 1000) / 10
      : null;

  const projections = [3, 5, 10].map((yrs) => ({
    years: yrs,
    atCurrentCagr:
      cagr != null && cagr > 0 ? Math.round(currentValue * (1 + cagr / 100) ** yrs) : null,
    atBenchmark: Math.round(currentValue * (1 + NIFTY_10YR / 100) ** yrs),
  }));

  let holdVerdict = "hold_moderate";
  let holdDetailKey = "wealthDetail.mf.holdModerate";
  if (cagr != null && cagr > NIFTY_10YR) {
    holdVerdict = "hold";
    holdDetailKey = "wealthDetail.mf.holdOutperform";
  } else if (realReturn != null && realReturn < 0) {
    holdVerdict = "review";
    holdDetailKey = "wealthDetail.mf.holdReview";
  }

  return {
    fundType,
    absoluteReturn,
    cagr,
    realReturn,
    vsBenchmark,
    yearsHeld: yearsHeld != null ? Math.round(yearsHeld * 10) / 10 : null,
    isLongTerm,
    isEquity,
    gain,
    taxIfRedeemed,
    netProceeds,
    elssLockRemaining,
    monthlySip,
    sipBurdenPct,
    projections,
    benchmarkCagr: NIFTY_10YR,
    holdVerdict,
    holdDetailKey,
    folio: entry.folio || "",
  };
}

/**
 * Flags redundant exposure — 3+ funds all in the same sub-type (e.g.
 * large-cap equity) look diversified by fund count but aren't. Uses the
 * existing fundSubType field, no new data.
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} entries
 * @param {number} [overlapThreshold] minimum funds in one sub-type to flag
 */
export function detectPortfolioOverlap(entries, overlapThreshold = 3) {
  const funds = (entries || []).filter((e) => e.kind === "asset" && e.categoryId === "mutual_fund" && !e.hidden);

  /** @type {Map<string, { subType: string, funds: { id: string, name: string, value: number }[], totalValue: number }>} */
  const groups = new Map();
  for (const f of funds) {
    const subType = f.fundSubType || "unclassified";
    if (!groups.has(subType)) groups.set(subType, { subType, funds: [], totalValue: 0 });
    const group = groups.get(subType);
    const value = Math.max(0, Number(f.value) || 0);
    group.funds.push({ id: f.id, name: f.name, value });
    group.totalValue += value;
  }

  const totalValue = funds.reduce((s, f) => s + Math.max(0, Number(f.value) || 0), 0);
  const overlapping = [...groups.values()]
    .filter((g) => g.funds.length >= overlapThreshold && g.subType !== "unclassified")
    .map((g) => ({ ...g, pctOfPortfolio: totalValue > 0 ? Math.round((g.totalValue / totalValue) * 100) : 0 }))
    .sort((a, b) => b.totalValue - a.totalValue);

  return {
    totalFunds: funds.length,
    totalValue,
    groups: [...groups.values()].sort((a, b) => b.totalValue - a.totalValue),
    overlapping,
    hasOverlap: overlapping.length > 0,
  };
}
