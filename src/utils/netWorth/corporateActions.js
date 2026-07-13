/**
 * Stock split / bonus share math. A split or bonus changes share count
 * without changing total money invested — so the average buy price per
 * share must shrink by the same multiplier the share count grows by.
 */

/**
 * Parses "A:B" (also accepts "A-B" or "A/B") in the standard "A-for-B"
 * split notation — you get A new shares for every B old shares — and
 * returns the growth multiplier A/B. "2:1" doubles the holding; a 1:10
 * reverse split shrinks it to a tenth.
 * @param {string} ratioStr
 * @returns {number | null}
 */
export function parseSplitMultiplier(ratioStr) {
  const match = String(ratioStr || "").trim().match(/^(\d+(?:\.\d+)?)\s*[:\-/]\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const newShares = Number(match[1]);
  const oldShares = Number(match[2]);
  if (!(oldShares > 0) || !(newShares > 0)) return null;
  return newShares / oldShares;
}

/**
 * Folds a split/bonus ratio into a holding: quantity grows by the
 * multiplier, average buy price shrinks by the same multiplier (total cost
 * basis quantity × buyPrice stays constant).
 * @param {{ quantity: number, buyPrice: number, ratio: string }} input
 * @returns {{ quantity: number, buyPrice: number } | null} null if the ratio can't be parsed or there's nothing to fold
 */
export function applyStockSplitOrBonus({ quantity, buyPrice, ratio }) {
  const multiplier = parseSplitMultiplier(ratio);
  if (multiplier == null) return null;
  const qty = Number(quantity) || 0;
  const price = Number(buyPrice) || 0;
  if (qty <= 0 || price <= 0) return null;
  return {
    quantity: Math.round(qty * multiplier * 1e6) / 1e6,
    buyPrice: Math.round((price / multiplier) * 100) / 100,
  };
}
