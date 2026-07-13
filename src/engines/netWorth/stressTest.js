import { computeSurvivalAnalysis } from "../survival.js";
import { safeNum } from "../_guard.js";

/** @typedef {'property-15'|'job-loss-3m'|'rate-rise-2pct'|'gold-10'|'stocks-20'|'combined'} StressScenarioId */

/**
 * "What happens if..." — reuses survival.js with shocked income/pool inputs
 * instead of building a parallel engine. Each scenario answers one concrete
 * shock; "combined" stacks all of them for a worst-case read.
 * @param {object} input
 * @param {number} input.income
 * @param {number} input.freeMoney
 * @param {number} input.liquidSavings
 * @param {number} input.monthlyBurden
 * @param {number} [input.propertyValue]
 * @param {number} [input.goldValue]
 * @param {number} [input.stockValue]
 * @param {number} [input.emiLoad] portion of monthlyBurden that is interest-rate-sensitive debt service
 * @param {(scenario: object) => object} [survivalFn] injectable for tests
 */
export function computeNetWorthStressTest(input, survivalFn = computeSurvivalAnalysis) {
  const income = Math.max(0, Number(input.income) || 0);
  const freeMoney = Math.max(0, Number(input.freeMoney) || 0);
  const liquidSavings = Math.max(0, Number(input.liquidSavings) || 0);
  const monthlyBurden = Math.max(0, Number(input.monthlyBurden) || 0);
  const propertyValue = Math.max(0, Number(input.propertyValue) || 0);
  const goldValue = Math.max(0, Number(input.goldValue) || 0);
  const stockValue = Math.max(0, Number(input.stockValue) || 0);
  const emiLoad = Math.max(0, Number(input.emiLoad) || 0);

  const baseline = survivalFn({ income, freeMoney, liquidSavings, monthlyBurden });

  const scenarios = {
    "job-loss-3m": survivalFn({ income: 0, freeMoney: 0, liquidSavings, monthlyBurden }),
    "rate-rise-2pct": survivalFn({
      income,
      freeMoney: Math.max(0, freeMoney - emiLoad * 0.15),
      liquidSavings,
      monthlyBurden: monthlyBurden + emiLoad * 0.15,
    }),
  };

  const netWorthShocks = {
    "property-15": {
      wealthDelta: -Math.round(propertyValue * 0.15),
      description: "property_drop_15",
    },
    "gold-10": {
      wealthDelta: -Math.round(goldValue * 0.1),
      description: "gold_drop_10",
    },
    "stocks-20": {
      wealthDelta: -Math.round(stockValue * 0.2),
      description: "stocks_drop_20",
    },
  };

  const combinedWealthDelta =
    netWorthShocks["property-15"].wealthDelta +
    netWorthShocks["gold-10"].wealthDelta +
    netWorthShocks["stocks-20"].wealthDelta;

  const combinedSurvival = survivalFn({
    income: 0,
    freeMoney: 0,
    liquidSavings: Math.max(0, liquidSavings + combinedWealthDelta * 0.05), // partial forced liquidation buffer
    monthlyBurden: monthlyBurden + emiLoad * 0.15,
  });

  /** @type {'resilient'|'fragile'|'critical'} */
  let resilience;
  const worstMonths = Math.min(
    safeNum(baseline.survivalMonths, 0),
    safeNum(scenarios["job-loss-3m"].survivalMonths, 0),
    safeNum(combinedSurvival.survivalMonths, 0),
  );
  if (worstMonths >= 3) resilience = "resilient";
  else if (worstMonths >= 1) resilience = "fragile";
  else resilience = "critical";

  return {
    baseline: { survivalMonths: safeNum(baseline.survivalMonths, 0) },
    incomeShocks: {
      "job-loss-3m": { survivalMonths: safeNum(scenarios["job-loss-3m"].survivalMonths, 0) },
      "rate-rise-2pct": { survivalMonths: safeNum(scenarios["rate-rise-2pct"].survivalMonths, 0) },
    },
    netWorthShocks,
    combined: {
      wealthDelta: combinedWealthDelta,
      survivalMonths: safeNum(combinedSurvival.survivalMonths, 0),
    },
    resilience,
  };
}
