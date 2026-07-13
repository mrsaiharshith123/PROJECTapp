/**
 * Which wealth-entry category ids count as "property" for valuation/location
 * intelligence. Shared by src/engines/propertyLocationIntel.js and
 * src/utils/netWorth/propertyValuation.js — kept here (constants layer) so
 * neither file has to import the other, which previously created a circular
 * import between the engines and utils layers.
 */
export const PROPERTY_CATEGORY_IDS = new Set([
  "property",
  "property_residential",
  "property_land",
  "property_commercial",
]);

/** @param {string} categoryId */
export function isPropertyCategory(categoryId) {
  return PROPERTY_CATEGORY_IDS.has(categoryId);
}
