/**
 * Deep analysis for physical gold, gold ETF, and sovereign gold bonds.
 */

import { computeAssetCagr } from "../utils/netWorth/physicalAssetHelpers.js";

const GOLD_3YR_CAGR_BENCHMARK = 13.5;
const MAKING_CHARGE_PCT = 15;
const LTCG_TAX_RATE = 0.125;
const LTCG_THRESHOLD_YEARS = 2;
const INFLATION = 6;

/**
 * @param {object} entry
 * @param {{ monthlyIncome?: number, goldRatePerGram?: number, taxSlab?: number }} settings
 */
export function analyzeGold(entry, settings = {}) {
  const currentValue = Number(entry.value) || 0;
  const weightGrams = Number(entry.weightGrams) || 0;
  const purityKarat = Number(entry.purityKarat) || 24;
  const purchasePrice = Number(entry.purchasePrice) || 0;
  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : null;
  const purchaseMonth = entry.purchaseMonth ? Number(entry.purchaseMonth) : 1;
  const liveRatePerGram = Number(settings.goldRatePerGram) || 0;
  const taxSlab = Number(settings.taxSlab) || 0.3;

  const yearsHeld = purchaseYear
    ? Math.max(
        0,
        (Date.now() - new Date(purchaseYear, (purchaseMonth || 1) - 1, 1).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25),
      )
    : null;

  const liveValue =
    liveRatePerGram > 0 && weightGrams > 0
      ? Math.round(weightGrams * liveRatePerGram * (purityKarat / 24))
      : null;

  const purchaseRatePerGram =
    purchasePrice > 0 && weightGrams > 0 ? Math.round(purchasePrice / weightGrams) : null;

  const makingChargesEstimate =
    entry.subType !== "digital" && purchasePrice > 0
      ? Math.round(purchasePrice * (MAKING_CHARGE_PCT / 100))
      : null;

  const cagr = computeAssetCagr(purchasePrice, purchaseYear, currentValue, purchaseMonth);
  const realReturn = cagr != null ? Math.round((cagr - INFLATION) * 10) / 10 : null;
  const vsBenchmark = cagr != null ? Math.round((cagr - GOLD_3YR_CAGR_BENCHMARK) * 10) / 10 : null;

  const isLongTerm = yearsHeld != null && yearsHeld >= LTCG_THRESHOLD_YEARS;
  const gain = purchasePrice > 0 ? currentValue - purchasePrice : null;
  const taxIfSoldNow =
    gain != null && gain > 0
      ? isLongTerm
        ? Math.round(gain * LTCG_TAX_RATE)
        : Math.round(gain * taxSlab)
      : null;
  const netProceedsIfSold = taxIfSoldNow != null ? currentValue - taxIfSoldNow : currentValue;

  let holdVerdict = "hold_moderate";
  let holdDetailKey = "wealthDetail.gold.holdModerateDetail";
  /** @type {Record<string, string | number> | undefined} */
  let holdDetailParams;

  if (yearsHeld != null && yearsHeld < LTCG_THRESHOLD_YEARS) {
    holdVerdict = "wait";
    holdDetailKey = "wealthDetail.gold.holdWaitDetail";
    holdDetailParams = {
      years: (yearsHeld || 0).toFixed(1),
      slab: Math.round(taxSlab * 100),
      taxSaving: Math.round(gain > 0 ? gain * (taxSlab - LTCG_TAX_RATE) : 0),
      ltcgYears: LTCG_THRESHOLD_YEARS,
    };
  } else if (realReturn != null && realReturn >= 5) {
    holdVerdict = "hold";
    holdDetailKey = "wealthDetail.gold.holdGoodDetail";
    holdDetailParams = { realReturn };
  } else if (realReturn != null && realReturn < 0) {
    holdVerdict = "review";
    holdDetailKey = "wealthDetail.gold.holdReviewDetail";
    holdDetailParams = { realReturn };
  }

  const projections = [3, 5, 10].map((yrs) => ({
    years: yrs,
    optimistic: Math.round(currentValue * 1.15 ** yrs),
    base: Math.round(currentValue * 1.11 ** yrs),
    conservative: Math.round(currentValue * 1.07 ** yrs),
  }));

  return {
    weightGrams,
    purityKarat,
    liveRatePerGram,
    liveValue,
    purchaseRatePerGram,
    makingChargesEstimate,
    makingChargePct: MAKING_CHARGE_PCT,
    cagr,
    realReturn,
    vsBenchmark,
    yearsHeld: yearsHeld != null ? Math.round(yearsHeld * 10) / 10 : null,
    isLongTerm,
    gain,
    taxIfSoldNow,
    netProceedsIfSold,
    holdVerdict,
    holdDetailKey,
    holdDetailParams,
    sgbNoteKey: "wealthDetail.gold.sgbNote",
    projections,
    benchmarkCagr: GOLD_3YR_CAGR_BENCHMARK,
    inflationPct: INFLATION,
  };
}
