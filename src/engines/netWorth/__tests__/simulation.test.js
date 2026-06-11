import { describe, expect, it } from "vitest";
import { runWealthSimulation, PRESET_SCENARIOS } from "../simulation.js";

describe("runWealthSimulation", () => {
  const base = {
    netWorth: 100000,
    liquidNetWorth: 50000,
    monthlyIncome: 80000,
    monthlyObligations: 30000,
    totalDebt: 20000,
    investableAssets: 10000,
  };

  it("projects salary raise scenario positively", () => {
    const scenario = PRESET_SCENARIOS.find((s) => s.id === "salary_raise");
    const r = runWealthSimulation(base, scenario);
    expect(r.deltaNetWorth).toBeGreaterThan(0);
    expect(r.stabilityKey).toMatch(/^netWorth\.sim\.outcome\./);
  });

  it("reduces debt when debt closure scenario selected", () => {
    const scenario = PRESET_SCENARIOS.find((s) => s.id === "close_loan");
    const r = runWealthSimulation(base, scenario);
    expect(r.projectedDebt).toBeLessThan(base.totalDebt);
  });
});
