/**
 * Tax-loss/gain harvesting scanner — cross-references unrealized gains and
 * losses across every stock/mutual-fund wealth entry to find offsetting
 * pairs before the financial-year close. Reuses the per-asset gain math
 * already in stockIntel.js/mutualFundIntel.js rather than re-deriving it.
 */
import { analyzeStock } from "./stockIntel.js";
import { analyzeMutualFund } from "./mutualFundIntel.js";

const HARVEST_CATEGORY_IDS = new Set(["stocks", "mutual_fund"]);

/**
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} entries
 * @param {{ monthlyIncome?: number, taxSlab?: number }} [settings]
 */
export function scanCapitalGainsHarvest(entries, settings = {}) {
  const candidates = (entries || []).filter(
    (e) => e.kind === "asset" && !e.hidden && HARVEST_CATEGORY_IDS.has(e.categoryId),
  );

  const rows = candidates
    .map((e) => {
      const analysis =
        e.categoryId === "stocks" ? analyzeStock(e, settings) : analyzeMutualFund(e, settings);
      const gain = analysis.totalGain ?? analysis.gain ?? null;
      if (gain == null) return null;
      return {
        id: e.id,
        name: e.name,
        categoryId: e.categoryId,
        gain: Math.round(gain),
        isLongTerm: Boolean(analysis.isLongTerm),
        value: Math.max(0, Number(e.value) || 0),
      };
    })
    .filter(Boolean);

  const gainers = rows.filter((r) => r.gain > 0).sort((a, b) => b.gain - a.gain);
  const losers = rows.filter((r) => r.gain < 0).sort((a, b) => a.gain - b.gain);

  const totalUnrealizedGain = gainers.reduce((s, r) => s + r.gain, 0);
  const totalUnrealizedLoss = Math.abs(losers.reduce((s, r) => s + r.gain, 0));
  const offsettable = Math.min(totalUnrealizedGain, totalUnrealizedLoss);

  // Approximate tax saved by harvesting the loss against the gain — use the
  // long-term rate if either side is long-term-eligible, short-term
  // otherwise (a simplification; actual set-off rules distinguish LT/ST
  // pools separately, so treat this as directional, not exact).
  const anyLongTerm = gainers.some((r) => r.isLongTerm) || losers.some((r) => r.isLongTerm);
  const approxRate = anyLongTerm ? 0.1 : 0.15;
  const estimatedTaxSaved = Math.round(offsettable * approxRate);

  const pairs = [];
  let remainingLoss = totalUnrealizedLoss;
  for (const g of gainers) {
    if (remainingLoss <= 0) break;
    const applied = Math.min(g.gain, remainingLoss);
    if (applied > 500) {
      pairs.push({ gainId: g.id, gainName: g.name, applied: Math.round(applied) });
      remainingLoss -= applied;
    }
  }

  return {
    gainers,
    losers,
    totalUnrealizedGain,
    totalUnrealizedLoss,
    offsettable,
    estimatedTaxSaved,
    pairs,
    hasOpportunity: offsettable > 1000 && losers.length > 0 && gainers.length > 0,
  };
}
