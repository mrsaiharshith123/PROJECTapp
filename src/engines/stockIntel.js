/**
 * Stock holding analysis — Indian (NSE/BSE) and US listings.
 * Live price is stored on the entry after manual or AI fetch.
 */

const NIFTY_10YR_CAGR = 13.5;
const LTCG_YEARS = 1;
const LTCG_RATE = 0.1;
const STCG_RATE = 0.15;
const LTCG_EXEMPTION = 100000;

/**
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {object} [_settings]
 */
export function analyzeStock(entry, _settings = {}) {
  const currentValue = Number(entry.value) || 0;
  const quantity = Number(entry.quantity) || 0;
  const buyPrice = Number(entry.buyPrice) || 0;
  const livePrice = Number(entry.lastLivePrice) || 0;
  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : null;
  const purchaseMonth = entry.purchaseMonth ? Number(entry.purchaseMonth) : 1;

  const effectiveLivePrice =
    livePrice > 0 ? livePrice : quantity > 0 ? currentValue / quantity : 0;

  const profitPerShare = buyPrice > 0 ? effectiveLivePrice - buyPrice : null;
  const totalCost =
    buyPrice > 0 && quantity > 0 ? buyPrice * quantity : Number(entry.purchasePrice) || 0;
  const totalGain = totalCost > 0 ? currentValue - totalCost : null;
  const gainPct =
    totalCost > 0 && totalGain != null
      ? Math.round((totalGain / totalCost) * 1000) / 10
      : null;

  const yearsHeld = purchaseYear
    ? Math.max(
        0,
        (Date.now() - new Date(purchaseYear, (purchaseMonth || 1) - 1, 1).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  const cagr =
    totalCost > 0 && currentValue > 0 && yearsHeld != null && yearsHeld > 0
      ? Math.round(((currentValue / totalCost) ** (1 / yearsHeld) - 1) * 1000) / 10
      : null;

  const isLongTerm = yearsHeld != null && yearsHeld >= LTCG_YEARS;
  const taxableGain =
    totalGain != null && totalGain > 0
      ? isLongTerm
        ? Math.max(0, totalGain - LTCG_EXEMPTION)
        : totalGain
      : 0;
  const taxIfSold = taxableGain > 0 ? Math.round(taxableGain * (isLongTerm ? LTCG_RATE : STCG_RATE)) : 0;
  const netProceeds = currentValue - taxIfSold;

  const actions = Array.isArray(entry.corporateActions) ? entry.corporateActions : [];
  const splits = actions.filter((a) => a.type === "split");
  const bonuses = actions.filter((a) => a.type === "bonus");
  const dividends = actions.filter((a) => a.type === "dividend");
  const totalDividendReceived = dividends.reduce((s, d) => s + (Number(d.amount) || 0), 0);

  const vsBenchmark = cagr != null ? Math.round((cagr - NIFTY_10YR_CAGR) * 10) / 10 : null;

  let holdVerdict = "hold";
  let holdDetailKey = "wealthDetail.stock.holdNeutral";
  if (cagr != null && cagr > NIFTY_10YR_CAGR + 3) {
    holdVerdict = "hold";
    holdDetailKey = "wealthDetail.stock.holdOutperform";
  } else if (cagr != null && cagr < 0) {
    holdVerdict = "review";
    holdDetailKey = "wealthDetail.stock.holdUnderperform";
  } else if (!isLongTerm && totalGain != null && totalGain > 0) {
    holdVerdict = "wait";
    holdDetailKey = "wealthDetail.stock.holdWaitLtcg";
  }

  const projections =
    currentValue > 0
      ? [1, 3, 5].map((yrs) => ({
          years: yrs,
          atCurrentCagr:
            cagr != null ? Math.round(currentValue * (1 + cagr / 100) ** yrs) : null,
          atBenchmark: Math.round(currentValue * (1 + NIFTY_10YR_CAGR / 100) ** yrs),
        }))
      : [];

  return {
    quantity,
    buyPrice,
    livePrice: effectiveLivePrice,
    totalCost,
    totalGain,
    gainPct,
    profitPerShare,
    cagr,
    yearsHeld: yearsHeld != null ? Math.round(yearsHeld * 10) / 10 : null,
    isLongTerm,
    taxIfSold,
    netProceeds,
    vsBenchmark,
    benchmarkCagr: NIFTY_10YR_CAGR,
    splits,
    bonuses,
    dividends,
    totalDividendReceived,
    holdVerdict,
    holdDetailKey,
    projections,
    ticker: entry.ticker || "",
    exchange: entry.exchange || "NSE",
  };
}
