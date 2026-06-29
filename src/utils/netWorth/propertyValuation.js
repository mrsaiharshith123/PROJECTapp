import { isPropertyCategory } from "../../engines/propertyLocationIntel.js";

const PROPERTY_RESIDENTIAL = "property_residential";

/** @param {string} categoryId */
export function isResidentialProperty(categoryId) {
  return categoryId === PROPERTY_RESIDENTIAL || categoryId === "property";
}

/** @param {import('./wealthStorage.js').WealthEntry} entry */
export function usesAutoPropertyValuation(entry) {
  return (
    entry?.kind === "asset" &&
    isPropertyCategory(entry.categoryId) &&
    Boolean(entry.valueAutoEstimated)
  );
}

/**
 * @param {number} purchaseYear
 * @param {number} [purchaseMonth] 1–12
 * @param {Date} [now]
 */
export function monthsSincePurchase(purchaseYear, purchaseMonth = 1, now = new Date()) {
  const year = Number(purchaseYear);
  const month = Math.min(12, Math.max(1, Number(purchaseMonth) || 1));
  if (!year) return null;
  return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
}

/**
 * @param {number} purchaseYear
 * @param {number} [purchaseMonth]
 * @param {Date} [now]
 */
export function yearsSincePurchase(purchaseYear, purchaseMonth = 1, now = new Date()) {
  const months = monthsSincePurchase(purchaseYear, purchaseMonth, now);
  if (months == null || months < 0) return null;
  return months / 12;
}

/**
 * @param {number} ratePerSqYard
 * @param {number} areaSqYards
 */
export function computePurchasePriceFromRate(ratePerSqYard, areaSqYards) {
  const rate = Number(ratePerSqYard);
  const area = Number(areaSqYards);
  if (!rate || !area || rate <= 0 || area <= 0) return null;
  return Math.round(rate * area);
}

/** @param {"metro" | "tier2" | "tier3" | string} [tier] */
export function propertyAnnualGrowthPct(tier) {
  if (tier === "metro") return 8.5;
  if (tier === "tier2") return 7;
  return 7.5;
}

/**
 * Compound growth from purchase to today (month-aware).
 * @param {number} purchasePrice
 * @param {number} purchaseYear
 * @param {number} [purchaseMonth]
 * @param {number} [annualGrowthPct]
 * @param {Date} [now]
 */
export function estimatePropertyCurrentValue(
  purchasePrice,
  purchaseYear,
  purchaseMonth = 1,
  annualGrowthPct = 7.5,
  now = new Date(),
) {
  const price = Number(purchasePrice);
  const years = yearsSincePurchase(purchaseYear, purchaseMonth, now);
  if (!price || price <= 0 || years == null || years <= 0) return null;
  const rate = Number(annualGrowthPct) || 7.5;
  return Math.round(price * Math.pow(1 + rate / 100, years));
}

/**
 * @param {import('./wealthStorage.js').WealthEntry} entry
 * @param {{ userCity?: string }} [settings]
 */
export function resolvePropertyGrowthTier(entry, settings = {}) {
  const label = entry.location || "";
  const cityId = settings.userCity || "";
  if (/hyderabad|bengaluru|mumbai|delhi|chennai|kolkata|pune/i.test(label)) return "metro";
  if (/jaipur|lucknow|nagpur|indore|coimbatore/i.test(label)) return "tier2";
  if (cityId && /metro|tier1/i.test(cityId)) return "metro";
  return "tier3";
}

/**
 * Live estimated value for auto-valued property entries.
 * @param {import('./wealthStorage.js').WealthEntry} entry
 * @param {{ userCity?: string }} [settings]
 */
export function resolveLivePropertyValue(entry, settings = {}) {
  if (!usesAutoPropertyValuation(entry)) return Number(entry.value) || 0;
  const purchasePrice = Number(entry.purchasePrice) || 0;
  if (!purchasePrice) return Number(entry.value) || 0;
  const tier = resolvePropertyGrowthTier(entry, settings);
  const growth = propertyAnnualGrowthPct(tier);
  const estimated = estimatePropertyCurrentValue(
    purchasePrice,
    entry.purchaseYear,
    entry.purchaseMonth,
    growth,
  );
  return estimated ?? (Number(entry.value) || 0);
}

/**
 * @param {import('./wealthStorage.js').WealthEntry} entry
 * @param {{ userCity?: string }} [settings]
 */
export function withLivePropertyValue(entry, settings = {}) {
  if (!usesAutoPropertyValuation(entry)) return entry;
  const value = resolveLivePropertyValue(entry, settings);
  if (value === entry.value) return entry;
  return { ...entry, value };
}
