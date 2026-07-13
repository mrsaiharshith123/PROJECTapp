import Decimal from "decimal.js";
import { getAssetCategory } from "../../constants/netWorth/wealthCategories.js";

/** @typedef {'instant' | 'fast' | 'slow' | 'very-slow'} LadderRung */

/**
 * Time-to-cash rung per liquidity tier — distinct from liquidity.js's
 * aggregate score, this itemizes which actual assets fall in which rung so
 * "if I needed 5L tomorrow" has real names attached, not just a number.
 * @param {import('../../constants/netWorth/wealthCategories.js').LiquidityTier} tier
 * @param {string} categoryId
 * @returns {LadderRung}
 */
function rungForAsset(tier, categoryId) {
  if (categoryId === "bank" || categoryId === "cash" || categoryId === "savings" || categoryId === "emergency") {
    return "instant";
  }
  if (tier === "liquid") return "instant";
  if (categoryId === "fd") return "fast"; // premature withdrawal, with penalty
  if (tier === "semi-liquid" || tier === "high-risk") return "fast";
  if (categoryId === "gold" || categoryId === "rd") return "slow";
  return "very-slow";
}

const RUNG_ORDER = /** @type {const} */ (["instant", "fast", "slow", "very-slow"]);

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} assets
 */
export function computeLiquidityLadder(assets) {
  /** @type {Record<LadderRung, { total: Decimal, items: { id: string, name: string, value: number, categoryId: string }[] }>} */
  const rungs = {
    instant: { total: new Decimal(0), items: [] },
    fast: { total: new Decimal(0), items: [] },
    slow: { total: new Decimal(0), items: [] },
    "very-slow": { total: new Decimal(0), items: [] },
  };

  for (const a of assets || []) {
    if (a.hidden) continue;
    const cat = getAssetCategory(a.categoryId);
    const rung = rungForAsset(cat.tier, a.categoryId);
    const value = Math.max(0, Number(a.value) || 0);
    rungs[rung].total = rungs[rung].total.plus(value);
    rungs[rung].items.push({ id: a.id, name: a.name, value, categoryId: a.categoryId });
  }

  let cumulative = new Decimal(0);
  const ladder = RUNG_ORDER.map((rung) => {
    cumulative = cumulative.plus(rungs[rung].total);
    return {
      rung,
      total: rungs[rung].total.toNumber(),
      cumulativeTotal: cumulative.toNumber(),
      items: rungs[rung].items.sort((a, b) => b.value - a.value),
    };
  });

  const grandTotal = cumulative.toNumber();

  return {
    ladder,
    grandTotal,
    instantTotal: rungs.instant.total.toNumber(),
    within7DaysTotal: rungs.instant.total.plus(rungs.fast.total).toNumber(),
    withinQuarterTotal: rungs.instant.total.plus(rungs.fast.total).plus(rungs.slow.total).toNumber(),
  };
}

/**
 * "If I needed X tomorrow" scenario — how much of a target amount is
 * actually reachable within each time horizon.
 * @param {ReturnType<typeof computeLiquidityLadder>} ladderResult
 * @param {number} targetAmount
 */
export function liquidityLadderScenario(ladderResult, targetAmount) {
  const target = Math.max(0, Number(targetAmount) || 0);
  if (target <= 0) return { target: 0, instantCoverage: 0, weekCoverage: 0, quarterCoverage: 0, shortfall: 0 };
  const instantCoverage = Math.min(target, ladderResult.instantTotal);
  const weekCoverage = Math.min(target, ladderResult.within7DaysTotal);
  const quarterCoverage = Math.min(target, ladderResult.withinQuarterTotal);
  return {
    target,
    instantCoverage,
    weekCoverage,
    quarterCoverage,
    shortfall: Math.max(0, target - ladderResult.withinQuarterTotal),
    fullyCoveredWithinQuarter: quarterCoverage >= target,
  };
}
