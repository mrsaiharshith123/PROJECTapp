import { describe, it, expect } from "vitest";
import { buildQuickScenarioSummaries } from "../quickScenarios.js";

describe("buildQuickScenarioSummaries", () => {
  it("returns rows for salaried income", () => {
    const pack = buildQuickScenarioSummaries({
      primaryIncome: 80000,
      secondaryMonthlyIncome: 0,
      commitments: [],
      getEffectiveStatus: () => "pending",
      liquidSavings: 100000,
      mode: "salaried",
    });
    expect(pack.rows.some((r) => r.id === "job_loss")).toBe(true);
    expect(pack.rows.some((r) => r.id === "fee_hike")).toBe(true);
  });

  it("includes second-income loss when secondary present", () => {
    const pack = buildQuickScenarioSummaries({
      primaryIncome: 50000,
      secondaryMonthlyIncome: 25000,
      commitments: [],
      getEffectiveStatus: () => "pending",
      liquidSavings: 0,
      mode: "family",
    });
    expect(pack.rows.some((r) => r.id === "lose_secondary")).toBe(true);
  });
});
