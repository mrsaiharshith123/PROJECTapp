import { PHYSICAL_ASSET_TYPES } from "../../services/ai/assetInsight.js";
import { yearsSincePurchase } from "./propertyValuation.js";

/** @param {string} categoryId */
export function isPhysicalAssetCategory(categoryId) {
  return PHYSICAL_ASSET_TYPES.includes(categoryId);
}

/**
 * @param {number} purchasePrice
 * @param {number} purchaseYear
 * @param {number} currentValue
 * @param {number} [purchaseMonth] 1–12
 * @param {Date} [now]
 * @returns {number | null} CAGR as percentage
 */
export function computeAssetCagr(
  purchasePrice,
  purchaseYear,
  currentValue,
  purchaseMonth = 1,
  now = new Date(),
) {
  const price = Number(purchasePrice);
  const value = Number(currentValue);
  const year = Number(purchaseYear);
  if (!price || !value || !year || price <= 0 || value <= 0) return null;
  const years = yearsSincePurchase(year, purchaseMonth, now);
  if (years == null || years <= 0) return null;
  const cagr = (Math.pow(value / price, 1 / years) - 1) * 100;
  return Number.isFinite(cagr) ? Math.round(cagr * 10) / 10 : null;
}

/**
 * Real CAGR after compounding inflation over the hold period (not simple subtraction).
 * @param {number} purchasePrice
 * @param {number} purchaseYear
 * @param {number} currentValue
 * @param {number} inflationPct annual inflation rate (%)
 * @param {number} [purchaseMonth] 1–12
 * @param {Date} [now]
 * @returns {number | null}
 */
export function computeRealCagr(
  purchasePrice,
  purchaseYear,
  currentValue,
  inflationPct,
  purchaseMonth = 1,
  now = new Date(),
) {
  const price = Number(purchasePrice);
  const value = Number(currentValue);
  const year = Number(purchaseYear);
  const inflation = Number(inflationPct);
  if (!price || !value || !year || price <= 0 || value <= 0 || !Number.isFinite(inflation)) return null;
  const years = yearsSincePurchase(year, purchaseMonth, now);
  if (years == null || years <= 0) return null;
  const inflationAdjustedCost = price * Math.pow(1 + inflation / 100, years);
  if (inflationAdjustedCost <= 0) return null;
  const realCagr = (Math.pow(value / inflationAdjustedCost, 1 / years) - 1) * 100;
  return Number.isFinite(realCagr) ? Math.round(realCagr * 10) / 10 : null;
}

/**
 * @param {number | undefined} purchaseYear
 * @param {(key: string, params?: object) => string} t
 */
export function formatHoldingPeriod(purchaseYear, t) {
  const year = Number(purchaseYear);
  if (!year) return "";
  const years = new Date().getFullYear() - year;
  if (years <= 0) return t("netWorth.physical.holdingLessThanYear");
  if (years === 1) return t("netWorth.physical.holdingOneYear");
  return t("netWorth.physical.holdingYears", { count: years });
}

/**
 * @param {import('./wealthStorage.js').WealthEntry} entry
 * @param {(key: string, params?: object) => string} t
 */
export function buildAssetDetailLine(entry, t) {
  const parts = [];

  if (entry.location) parts.push(entry.location);

  if (entry.categoryId === "vehicle") {
    if (entry.vehicleMake) parts.push(entry.vehicleMake);
    if (entry.vehicleYear) parts.push(String(entry.vehicleYear));
  }

  if (entry.categoryId === "gold") {
    if (entry.weightGrams) parts.push(t("netWorth.physical.weightGrams", { grams: entry.weightGrams }));
    if (entry.purityKarat) parts.push(t("netWorth.physical.purityKarat", { karat: entry.purityKarat }));
  }

  if (
    entry.categoryId === "property" ||
    entry.categoryId === "property_residential" ||
    entry.categoryId === "property_land" ||
    entry.categoryId === "property_commercial"
  ) {
    if (entry.areaMeasure && entry.areaUnit) {
      const unitKey = entry.areaUnit === "sqyd" ? "sqyd" : entry.areaUnit;
      parts.push(t(`netWorth.physical.areaUnit.${unitKey}`, { measure: entry.areaMeasure }));
    }
  }

  return parts.join(" · ");
}

const GOLD_CATEGORY_IDS = new Set(["gold"]);

/**
 * @param {number | undefined | null} weightGrams
 * @param {number | undefined | null} purityKarat
 * @param {number | undefined | null} goldRatePerGram
 * @returns {number | null}
 */
export function computeGoldAutoValue(weightGrams, purityKarat, goldRatePerGram) {
  const weight = Number(weightGrams);
  const rate = Number(goldRatePerGram);
  if (!weight || !rate) return null;
  const purity = Number(purityKarat) || 24;
  return Math.round(weight * rate * (purity / 24));
}

/**
 * @param {string} categoryId
 */
export function isGoldAssetCategory(categoryId) {
  return GOLD_CATEGORY_IDS.has(categoryId);
}

/**
 * @param {number | undefined | null} entryValue
 * @param {number | null} autoValue
 */
export function shouldSuggestGoldSync(entryValue, autoValue) {
  if (!autoValue) return false;
  const val = Number(entryValue) || 0;
  if (val <= 0) return true;
  return Math.abs(autoValue - val) / autoValue > 0.1;
}
