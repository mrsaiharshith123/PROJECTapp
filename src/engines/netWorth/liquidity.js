import { computeNetWorthCore } from "./core.js";
import { safeNum, safeScore } from "../_guard.js";

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
  const obligations = Math.max(1, safeNum(input.monthlyObligations, 1));
  const income = safeNum(input.monthlyIncome, 0);
  const pureLiquid = safeNum(liquidityBreakdown.liquid, 0);
  const survivalMonths = obligations > 0 ? pureLiquid / obligations : 0;
  const accessibleSafetyRatio = income > 0 ? pureLiquid / (income * 3) : pureLiquid / obligations;
  const lockedPct = totalAssets > 0 ? safeNum(((liquidityBreakdown.locked || 0) / totalAssets) * 100, 0) : 0;
  const flexibilityScore = safeScore(
    (survivalMonths / 6) * 40 +
    (accessibleSafetyRatio * 30) +
    (liquidNetWorth > 0 ? 30 : 0)
  );

  /** @type {'strong' | 'moderate' | 'weak' | 'critical'} */
  let strength;
  if (survivalMonths >= 6 && liquidNetWorth > 0) strength = "strong";
  else if (survivalMonths >= 3) strength = "moderate";
  else if (survivalMonths >= 1) strength = "weak";
  else strength = "critical";

  return {
    pureLiquid: safeNum(pureLiquid),
    liquidNetWorth: safeNum(core.liquidNetWorth),
    survivalMonths: safeNum(Math.round(survivalMonths * 10) / 10),
    accessibleSafetyRatio: safeNum(Math.round(accessibleSafetyRatio * 100) / 100),
    emergencyLiquidityStrength: strength,
    flexibilityScore,
    lockedWealthPct: safeNum(Math.round(lockedPct)),
    semiLiquid: safeNum(liquidityBreakdown["semi-liquid"], 0),
    highRisk: safeNum(liquidityBreakdown["high-risk"], 0),
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
