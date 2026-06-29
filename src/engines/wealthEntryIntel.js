import { getAssetCategory, getLiabilityCategory } from "../constants/netWorth/wealthCategories.js";
import {
  computeAssetCagr,
  isPhysicalAssetCategory,
} from "../utils/netWorth/physicalAssetHelpers.js";
import { estimateVehicleValue } from "../utils/vehicleDepreciation.js";
import {
  analyzePropertyLocation,
  isPropertyCategory,
  resolvePurchasePrice,
} from "./propertyLocationIntel.js";
import { isInstrumentWealthEntry } from "../utils/ledger/ledgerBuckets.js";

/**
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {object} [settings]
 * @param {object} [opts]
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} [opts.allEntries]
 */
export function buildWealthEntryIntel(entry, settings = {}, opts = {}) {
  const cat =
    entry.kind === "asset"
      ? getAssetCategory(entry.categoryId)
      : getLiabilityCategory(entry.categoryId);
  const physical = entry.kind === "asset" && isPhysicalAssetCategory(entry.categoryId);
  const isProperty = isPropertyCategory(entry.categoryId);
  const isVehicle = entry.categoryId === "vehicle";
  const isInstrument = isInstrumentWealthEntry(entry);
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

  const propertyIntel = isProperty ? analyzePropertyLocation(entry, settings) : null;

  const emi = Number(entry.emi) || 0;
  const interestRate = Number(entry.interestRate) || 0;
  const emiBurdenPct =
    entry.kind === "liability" && monthlyIncome > 0 && emi > 0
      ? Math.round((emi / monthlyIncome) * 1000) / 10
      : null;

  let instrumentMaturityYears = null;
  if (isInstrument && purchaseYear) {
    const term = entry.categoryId === "fd_rd" ? 5 : entry.categoryId === "ppf_epf" ? 15 : null;
    if (term) instrumentMaturityYears = Math.max(0, term - (yearsHeld || 0));
  }

  const valueSeries = [];
  if (purchaseAmount > 0 && purchaseYear && currentValue > 0 && yearsHeld != null && yearsHeld > 0) {
    for (let y = 0; y <= yearsHeld; y++) {
      const year = purchaseYear + y;
      const fraction = y / yearsHeld;
      const interpolated = purchaseAmount + (currentValue - purchaseAmount) * fraction;
      valueSeries.push({ year, value: Math.round(interpolated) });
    }
  } else if (currentValue > 0) {
    valueSeries.push({ year: new Date().getFullYear(), value: currentValue });
  }

  return {
    categoryLabelKey: cat.labelKey,
    physical,
    isProperty,
    isVehicle,
    isInstrument,
    cagr,
    yearsHeld,
    gain,
    gainPct,
    purchasePrice: purchaseAmount,
    purchaseSource: purchasePrice.source,
    currentValue,
    purchaseYear,
    vehicleEstimate,
    propertyIntel,
    emi,
    interestRate,
    emiBurdenPct,
    instrumentMaturityYears,
    valueSeries,
    monthlyIncome,
  };
}
