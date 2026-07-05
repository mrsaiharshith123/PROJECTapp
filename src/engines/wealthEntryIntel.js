import { getAssetCategory, getLiabilityCategory } from "../constants/netWorth/wealthCategories.js";
import {
  computeAssetCagr,
  isPhysicalAssetCategory,
} from "../utils/netWorth/physicalAssetHelpers.js";
import { estimateVehicleValue, analyzeVehicle } from "../utils/vehicleDepreciation.js";
import {
  analyzePropertyLocation,
  isPropertyCategory,
  resolvePurchasePrice,
} from "./propertyLocationIntel.js";
import { analyzeGold } from "./goldIntel.js";
import { analyzeFd, isFdCategory } from "./fdIntel.js";
import { analyzeStock } from "./stockIntel.js";
import { analyzeMutualFund } from "./mutualFundIntel.js";
import { analyzeCrypto } from "./cryptoIntel.js";
import { analyzeLoan } from "./loanIntel.js";
import { computeEpfProjection, estimateBasicFromGross } from "./epfTracker.js";
import { buildPropertyValueSeries } from "../utils/netWorth/propertyValueHistory.js";
import { buildAssetChartMilestones, buildGoldAnchorSeries } from "../utils/netWorth/assetChartMilestones.js";
import { isInstrumentWealthEntry } from "../utils/ledger/ledgerBuckets.js";

/**
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {object} [settings]
 * @param {object} [opts]
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} [opts.allEntries]
 */
export function buildWealthEntryIntel(entry, settings = {}, _opts = {}) {
  const cat =
    entry.kind === "asset"
      ? getAssetCategory(entry.categoryId)
      : getLiabilityCategory(entry.categoryId);
  const physical = entry.kind === "asset" && isPhysicalAssetCategory(entry.categoryId);
  const isProperty = isPropertyCategory(entry.categoryId);
  const isVehicle = entry.categoryId === "vehicle";
  const isInstrument = isInstrumentWealthEntry(entry);
  const isGold = entry.categoryId === "gold";
  const isFd = isFdCategory(entry.categoryId);
  const isStock = entry.categoryId === "stocks";
  const isMutualFund = entry.categoryId === "mutual_fund" || entry.categoryId === "sip";
  const isCrypto = entry.categoryId === "crypto";
  const isEpf = entry.categoryId === "pf_epf";
  const isLoan = entry.kind === "liability";
  const monthlyIncome = Math.max(0, Number(settings.monthlyIncome) || 0);

  const purchasePrice = resolvePurchasePrice(entry);
  const purchaseAmount = purchasePrice.price;
  const currentValue = Number(entry.value) || 0;
  const purchaseYear = entry.purchaseYear ? Number(entry.purchaseYear) : null;
  const purchaseMonth = entry.purchaseMonth ? Number(entry.purchaseMonth) : 1;
  const yearsHeld = purchaseYear ? new Date().getFullYear() - purchaseYear : null;
  const cagr = physical
    ? computeAssetCagr(purchaseAmount, purchaseYear, currentValue, purchaseMonth)
    : null;
  const gain = purchaseAmount > 0 ? currentValue - purchaseAmount : null;
  const gainPct = purchaseAmount > 0 ? Math.round(((currentValue - purchaseAmount) / purchaseAmount) * 1000) / 10 : null;

  const vehicleEstimate =
    isVehicle && purchaseAmount > 0
      ? estimateVehicleValue({
          purchasePrice: entry.purchasePrice,
          purchaseYear: entry.purchaseYear,
          vehicleYear: entry.vehicleYear,
        })
      : null;

  const vehicleIntel = isVehicle ? analyzeVehicle(entry, settings) : null;
  const propertyIntel = isProperty ? analyzePropertyLocation(entry, settings) : null;
  const goldIntel = isGold ? analyzeGold(entry, settings) : null;
  const fdIntel =
    isFd && (entry.interestRate || entry.maturityDate || entry.purchasePrice)
      ? analyzeFd(entry, settings)
      : null;
  const stockIntel = isStock ? analyzeStock(entry, settings) : null;
  const mfIntel = isMutualFund ? analyzeMutualFund(entry, settings) : null;
  const cryptoIntel = isCrypto ? analyzeCrypto(entry, settings) : null;
  const loanIntel = isLoan && entry.emi ? analyzeLoan(entry, settings) : null;

  const birthYear = Number(settings.birthYear) || null;
  const age = birthYear ? new Date().getFullYear() - birthYear : 30;
  const epfIntel = isEpf
    ? computeEpfProjection({
        monthlyBasicSalary:
          Number(settings.monthlyBasic) || estimateBasicFromGross(monthlyIncome),
        currentCorpus: currentValue,
        age,
        retirementAge: Number(settings.retirementAge) || 60,
        growthRate: 0.0815,
      })
    : null;

  const emi = Number(entry.emi) || 0;
  const interestRate = Number(entry.interestRate) || 0;
  const emiBurdenPct =
    isLoan && monthlyIncome > 0 && emi > 0
      ? Math.round((emi / monthlyIncome) * 1000) / 10
      : loanIntel?.emiBurdenPct ?? null;

  let instrumentMaturityYears = null;
  if (isInstrument && purchaseYear) {
    const term =
      entry.categoryId === "fd" || entry.categoryId === "rd"
        ? 5
        : entry.categoryId === "pf_epf"
          ? 15
          : null;
    if (term) instrumentMaturityYears = Math.max(0, term - (yearsHeld || 0));
  }

  let valueSeries = [];
  let valueSeriesSource = "linear";

  if (isProperty && purchaseAmount > 0 && purchaseYear && currentValue > 0) {
    const propSeries = buildPropertyValueSeries(entry);
    valueSeries = propSeries.map((p) => ({ year: p.year, value: p.value }));
    valueSeriesSource = propSeries.some((p) => p.source === "ai") ? "ai" : "linear";
  } else if (isGold && purchaseAmount > 0 && purchaseYear && currentValue > 0) {
    const goldSeries = buildGoldAnchorSeries(entry);
    valueSeries = goldSeries.length >= 2 ? goldSeries : [];
    if (!valueSeries.length && yearsHeld != null && yearsHeld > 0) {
      for (let y = 0; y <= yearsHeld; y++) {
        const year = purchaseYear + y;
        const fraction = y / yearsHeld;
        valueSeries.push({
          year,
          value: Math.round(purchaseAmount + (currentValue - purchaseAmount) * fraction),
        });
      }
    }
    valueSeriesSource = goldSeries.length >= 2 ? "anchor" : "linear";
  } else if (isVehicle && vehicleIntel?.depreciationCurve?.length >= 2) {
    valueSeries = vehicleIntel.depreciationCurve.map((p) => ({ year: p.year, value: p.value }));
    valueSeriesSource = "linear";
  } else if (purchaseAmount > 0 && purchaseYear && currentValue > 0 && yearsHeld != null && yearsHeld > 0) {
    for (let y = 0; y <= yearsHeld; y++) {
      const year = purchaseYear + y;
      const fraction = y / yearsHeld;
      const interpolated = purchaseAmount + (currentValue - purchaseAmount) * fraction;
      valueSeries.push({ year, value: Math.round(interpolated) });
    }
  } else if (currentValue > 0) {
    valueSeries.push({ year: new Date().getFullYear(), value: currentValue });
  }

  const chartColor =
    (stockIntel?.cagr ?? mfIntel?.cagr ?? cryptoIntel?.cagr ?? cagr) != null &&
    (stockIntel?.cagr ?? mfIntel?.cagr ?? cryptoIntel?.cagr ?? cagr) < 0
      ? "var(--ed-red)"
      : "var(--ed-gold)";

  const chartMilestones = buildAssetChartMilestones(entry, {
    valueSeries,
    valueSeriesSource,
    purchaseYear,
  });

  return {
    categoryLabelKey: cat.labelKey,
    physical,
    isProperty,
    isVehicle,
    isInstrument,
    isStock,
    isMutualFund,
    isCrypto,
    isEpf,
    isLoan,
    cagr: stockIntel?.cagr ?? mfIntel?.cagr ?? cryptoIntel?.cagr ?? cagr,
    yearsHeld: stockIntel?.yearsHeld ?? mfIntel?.yearsHeld ?? cryptoIntel?.yearsHeld ?? yearsHeld,
    gain: stockIntel?.totalGain ?? mfIntel?.gain ?? cryptoIntel?.gain ?? gain,
    gainPct: stockIntel?.gainPct ?? mfIntel?.absoluteReturn ?? cryptoIntel?.gainPct ?? gainPct,
    purchasePrice: purchaseAmount,
    purchaseSource: purchasePrice.source,
    currentValue,
    purchaseYear,
    vehicleEstimate,
    vehicleIntel,
    propertyIntel,
    goldIntel,
    fdIntel,
    stockIntel,
    mfIntel,
    cryptoIntel,
    epfIntel,
    loanIntel,
    isGold,
    isFd,
    emi,
    interestRate,
    emiBurdenPct,
    instrumentMaturityYears,
    valueSeries,
    valueSeriesSource,
    chartColor,
    chartMilestones,
    monthlyIncome,
  };
}
