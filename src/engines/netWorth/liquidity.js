import { computeNetWorthCore } from "./core.js";

/**
 * @param {object} input
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry[]} input.entries
 * @param {number} input.monthlyObligations
 * @param {number} input.monthlyIncome
 * @param {number} [input.emergencyFundTarget]
 */
export function computeLiquidityIntelligence(input) {
  const core = computeNetWorthCore(input.entries);
  const { liquidityBreakdown, liquidNetWorth, totalAssets } = core;
  const obligations = Math.max(1, Number(input.monthlyObligations) || 1);
  const income = Math.max(0, Number(input.monthlyIncome) || 0);

  const pureLiquid = liquidityBreakdown.liquid || 0;
  const survivalMonths = pureLiquid / obligations;
  const accessibleSafetyRatio = income > 0 ? pureLiquid / (income * 3) : pureLiquid / obligations;
  const lockedPct = totalAssets > 0 ? ((liquidityBreakdown.locked || 0) / totalAssets) * 100 : 0;
  const flexibilityScore = Math.max(0, Math.min(100, Math.round(
    (survivalMonths / 6) * 40 +
    (accessibleSafetyRatio * 30) +
    (liquidNetWorth > 0 ? 30 : 0)
  )));

  /** @type {'strong' | 'moderate' | 'weak' | 'critical'} */
  let strength;
  if (survivalMonths >= 6 && liquidNetWorth > 0) strength = "strong";
  else if (survivalMonths >= 3) strength = "moderate";
  else if (survivalMonths >= 1) strength = "weak";
  else strength = "critical";

  return {
    pureLiquid,
    liquidNetWorth: core.liquidNetWorth,
    survivalMonths: Math.round(survivalMonths * 10) / 10,
    accessibleSafetyRatio: Math.round(accessibleSafetyRatio * 100) / 100,
    emergencyLiquidityStrength: strength,
    flexibilityScore,
    lockedWealthPct: Math.round(lockedPct),
    semiLiquid: liquidityBreakdown["semi-liquid"] || 0,
    highRisk: liquidityBreakdown["high-risk"] || 0,
    insightKeys: buildLiquidityInsightKeys({
      survivalMonths,
      lockedPct,
      liquidNetWorth: core.liquidNetWorth,
      netWorth: core.netWorth,
    }),
  };
}

function buildLiquidityInsightKeys({ survivalMonths, lockedPct, liquidNetWorth, netWorth }) {
  /** @type {{ key: string, params?: Record<string, string|number> }[]} */
  const keys = [];
  if (lockedPct > 55) {
    keys.push({ key: "netWorth.insight.lockedWealth", params: { pct: Math.round(lockedPct) } });
  }
  if (survivalMonths > 0 && survivalMonths < 6) {
    keys.push({
      key: "netWorth.insight.survivalMonths",
      params: { months: Math.round(survivalMonths * 10) / 10 },
    });
  }
  if (netWorth > 0 && liquidNetWorth < netWorth * 0.25) {
    keys.push({ key: "netWorth.insight.flexibilityWeak" });
  }
  if (survivalMonths >= 6) {
    keys.push({ key: "netWorth.insight.liquidityStrong" });
  }
  return keys;
}
