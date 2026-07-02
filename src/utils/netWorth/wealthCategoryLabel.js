import { ASSET_CATEGORIES } from "../../constants/netWorth/wealthCategories.js";

/**
 * Human-readable label for a wealth entry category.
 * @param {(key: string) => string} t
 * @param {string} categoryId
 * @returns {string}
 */
export function wealthCategoryLabel(t, categoryId) {
  const def = ASSET_CATEGORIES.find((c) => c.id === categoryId);
  return def ? t(def.labelKey) : categoryId;
}
