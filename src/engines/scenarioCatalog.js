import { runWealthSimulation } from "./netWorth/simulation.js";

/** @typedef {import('./netWorth/simulation.js').SimulationScenario & { labelKey: string, requires?: (base: object) => boolean }} WealthScenarioDef */

/** @type {WealthScenarioDef[]} */
export const WEALTH_SCENARIO_DEFS = [
  {
    id: "salary_raise",
    labelKey: "netWorth.sim.salaryRaise",
    salaryDeltaPct: 15,
    monthsAhead: 12,
    requires: (b) => (b.monthlyIncome || 0) > 0,
  },
  {
    id: "cut_expenses",
    labelKey: "netWorth.sim.cutExpenses",
    expenseDeltaPct: -12,
    monthsAhead: 12,
    requires: (b) => (b.monthlyObligations || 0) > 0,
  },
  {
    id: "debt_paydown",
    labelKey: "netWorth.sim.debtPaydown",
    debtClosure: 1,
    emiPrepayment: 50000,
    monthsAhead: 12,
    requires: (b) => (b.totalDebt || 0) > 0,
  },
  {
    id: "emergency",
    labelKey: "netWorth.sim.emergency",
    lumpSum: -150000,
    monthsAhead: 1,
    requires: (b) => (b.monthlyIncome || 0) > 0 || (b.liquidNetWorth || 0) > 0,
  },
];

/** @param {object} simulationBase */
export function getApplicableWealthScenarios(simulationBase) {
  return WEALTH_SCENARIO_DEFS.filter((s) => !s.requires || s.requires(simulationBase));
}

/**
 * @param {object} input
 * @param {ReturnType<typeof import('./quickScenarios.js').buildQuickScenarioSummaries>} input.pack
 * @param {object} input.simulationBase
 * @param {(key: string) => string} input.t
 */
export function buildUnifiedScenarioTiles({ pack, simulationBase, t }) {
  /** @type {{ id: string, kind: 'cashflow' | 'wealth', label: string, row?: object, scenario?: object }[]} */
  const tiles = [];

  for (const row of pack.rows) {
    tiles.push({
      id: `cf-${row.id}`,
      kind: "cashflow",
      label: row.label,
      row,
    });
  }

  for (const scenario of getApplicableWealthScenarios(simulationBase)) {
    tiles.push({
      id: `nw-${scenario.id}`,
      kind: "wealth",
      label: t(scenario.labelKey),
      scenario,
    });
  }

  return tiles;
}

export { runWealthSimulation };
