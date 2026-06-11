import { describe, expect, it } from "vitest";
import { computePressureVsWealth } from "../pressureWealth.js";

describe("computePressureVsWealth", () => {
  it("classifies wealth vs obligation posture", () => {
    const r = computePressureVsWealth({
      netWorth: 150000,
      liquidNetWorth: 100000,
      monthlyObligations: 30000,
      monthlyIncome: 80000,
      totalDebt: 50000,
      flexibilityScore: 55,
      monthlyGrowthPct: 1.5,
    });
    expect(r.posture).toBeTruthy();
    expect(r.obligationIntensity).toBeGreaterThan(0);
  });
});
