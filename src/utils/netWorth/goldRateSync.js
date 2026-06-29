import { emitLocalDataChanged } from "../../storage/events.js";
import { computeGoldAutoValue, shouldSuggestGoldSync } from "./physicalAssetHelpers.js";
import { loadWealthState, saveWealthState } from "./wealthStorage.js";

/**
 * Apply live gold rate to entries saved with weight but no value yet (or stale auto value).
 * @param {number} goldRatePerGram
 * @returns {boolean} whether any entry changed
 */
export function applyGoldRateToWealth(goldRatePerGram) {
  const rate = Number(goldRatePerGram);
  if (!rate) return false;

  const state = loadWealthState();
  let changed = false;
  const entries = state.entries.map((entry) => {
    if (entry.categoryId !== "gold" || !entry.weightGrams) return entry;
    const auto = computeGoldAutoValue(entry.weightGrams, entry.purityKarat, rate);
    if (!auto) return entry;

    const val = Number(entry.value) || 0;
    const pendingAuto = entry.valueAutoEstimated && val <= 0;
    const staleAuto = entry.valueAutoEstimated && val > 0 && shouldSuggestGoldSync(val, auto);
    if (!pendingAuto && !staleAuto) return entry;

    changed = true;
    return { ...entry, value: auto, valueAutoEstimated: true, updatedAt: Date.now() };
  });

  if (!changed) return false;
  saveWealthState({ ...state, entries });
  emitLocalDataChanged();
  return true;
}
