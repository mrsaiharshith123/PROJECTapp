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

/**
 * Property values are set via Google Search at save/refresh — not compounded locally.
 * @param {import('./wealthStorage.js').WealthEntry} entry
 */
export function withLivePropertyValue(entry) {
  return entry;
}
