import { partitionWealth } from "../engines/netWorth/core.js";
import { getAssetCategory } from "../constants/netWorth/wealthCategories.js";

/**
 * Liquid cash available for emergencies — from bank/cash assets first, then legacy profile field.
 * @param {object} [settings]
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} [entries]
 */
export function resolveEmergencyLiquidPool(settings, entries = []) {
  const { assets } = partitionWealth(entries || []);
  const fromLedger = assets.reduce((sum, asset) => {
    const tier = getAssetCategory(asset.categoryId).tier;
    if (tier !== "liquid") return sum;
    return sum + Math.max(0, Number(asset.value) || 0);
  }, 0);
  if (fromLedger > 0) return Math.round(fromLedger);
  return Math.max(0, Math.round(Number(settings?.liquidSavings) || 0));
}
