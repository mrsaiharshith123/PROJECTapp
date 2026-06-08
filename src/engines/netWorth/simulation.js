/**
 * Life financial simulation — scenario modeling.
 * @typedef {object} SimulationScenario
 * @property {string} id
 * @property {string} labelKey
 * @property {number} [salaryDeltaPct]
 * @property {number} [expenseDeltaPct]
 * @property {number} [lumpSum]
 * @property {number} [debtClosure]
 * @property {number} [emiPrepayment]
 * @property {number} [monthsAhead]
 * @property {number} [inflationPct]
 * @property {number} [investmentGrowthPct]
 */

export const PRESET_SCENARIOS = [
  { id: "salary_raise", labelKey: "netWorth.sim.salaryRaise", salaryDeltaPct: 15, monthsAhead: 12 },
  { id: "cut_expenses", labelKey: "netWorth.sim.cutExpenses", expenseDeltaPct: -12, monthsAhead: 12 },
  { id: "close_loan", labelKey: "netWorth.sim.closeLoan", debtClosure: 1, monthsAhead: 6 },
  { id: "emi_prepay", labelKey: "netWorth.sim.emiPrepay", emiPrepayment: 50000, monthsAhead: 12 },
  { id: "layoff", labelKey: "netWorth.sim.layoff", salaryDeltaPct: -100, monthsAhead: 6 },
  { id: "emergency", labelKey: "netWorth.sim.emergency", lumpSum: -150000, monthsAhead: 1 },
  { id: "side_income", labelKey: "netWorth.sim.sideIncome", salaryDeltaPct: 20, monthsAhead: 12 },
  { id: "child_expense", labelKey: "netWorth.sim.childExpense", expenseDeltaPct: 18, monthsAhead: 24 },
];

/**
 * @param {object} base
 * @param {SimulationScenario} scenario
 */
export function runWealthSimulation(base, scenario) {
  const months = Math.max(1, Number(scenario.monthsAhead) || 12);
  const income = base.monthlyIncome || 0;
  const expenses = base.monthlyObligations || 0;
  const netWorth = base.netWorth || 0;
  const liquid = base.liquidNetWorth || 0;
  const debt = base.totalDebt || 0;

  const incomeDelta = income * ((scenario.salaryDeltaPct || 0) / 100);
  const expenseDelta = expenses * ((scenario.expenseDeltaPct || 0) / 100);
  const monthlyNet = income + incomeDelta - expenses - expenseDelta;
  const lump = Number(scenario.lumpSum) || 0;
  const debtCut = scenario.debtClosure ? debt * 0.3 : (Number(scenario.emiPrepayment) || 0);

  let projectedNetWorth = netWorth + monthlyNet * months + lump - debtCut;
  let projectedLiquid = liquid + monthlyNet * months * 0.6 + lump - debtCut * 0.5;
  const invGrowth = (scenario.investmentGrowthPct || 8) / 100 / 12;
  projectedNetWorth += base.investableAssets * invGrowth * months;
  projectedLiquid += base.investableAssets * invGrowth * months * 0.5;

  const inflation = (scenario.inflationPct || 5) / 100 / 12;
  projectedNetWorth -= expenses * inflation * months;

  const projectedDebt = Math.max(0, debt - debtCut - (scenario.emiPrepayment ? scenario.emiPrepayment : 0));
  const projectedPressure = base.monthlyIncome > 0
    ? ((expenses + expenseDelta) / (income + incomeDelta)) * 100
    : 100;

  return {
    scenarioId: scenario.id,
    months,
    projectedNetWorth: Math.round(projectedNetWorth),
    projectedLiquid: Math.round(projectedLiquid),
    projectedDebt: Math.round(projectedDebt),
    projectedPressure: Math.round(projectedPressure),
    monthlySurplus: Math.round(monthlyNet),
    survivabilityMonths:
      expenses + expenseDelta > 0
        ? Math.round((projectedLiquid / (expenses + expenseDelta)) * 10) / 10
        : 99,
    deltaNetWorth: Math.round(projectedNetWorth - netWorth),
    stabilityKey:
      projectedPressure < 35
        ? "netWorth.sim.outcome.stable"
        : projectedPressure < 50
          ? "netWorth.sim.outcome.moderate"
          : "netWorth.sim.outcome.strained",
  };
}
