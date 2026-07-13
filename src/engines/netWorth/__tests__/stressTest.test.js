import { describe, it, expect } from "vitest";
import { computeNetWorthStressTest } from "../stressTest.js";

const fakeSurvival = (input) => ({
  survivalMonths: input.income === 0 && input.freeMoney === 0 ? Math.max(0, input.liquidSavings / Math.max(1, input.monthlyBurden)) : 12,
});

describe("computeNetWorthStressTest", () => {
  const base = {
    income: 80000,
    freeMoney: 20000,
    liquidSavings: 300000,
    monthlyBurden: 50000,
    propertyValue: 8000000,
    goldValue: 500000,
    stockValue: 300000,
    emiLoad: 20000,
  };

  it("computes wealth deltas for each net-worth shock scenario", () => {
    const result = computeNetWorthStressTest(base, fakeSurvival);
    expect(result.netWorthShocks["property-15"].wealthDelta).toBe(-1200000);
    expect(result.netWorthShocks["gold-10"].wealthDelta).toBe(-50000);
    expect(result.netWorthShocks["stocks-20"].wealthDelta).toBe(-60000);
    expect(result.combined.wealthDelta).toBe(-1310000);
  });

  it("never returns NaN or crashes on zero/missing inputs", () => {
    const result = computeNetWorthStressTest({}, fakeSurvival);
    expect(Number.isFinite(result.baseline.survivalMonths)).toBe(true);
    expect(Number.isFinite(result.combined.survivalMonths)).toBe(true);
    expect(result.resilience).toBeTypeOf("string");
  });

  it("classifies resilience based on the worst-case survival months across scenarios", () => {
    const fragile = computeNetWorthStressTest({ ...base, liquidSavings: 10000, monthlyBurden: 50000 }, fakeSurvival);
    expect(["fragile", "critical"]).toContain(fragile.resilience);

    const resilient = computeNetWorthStressTest({ ...base, liquidSavings: 5000000, monthlyBurden: 10000 }, fakeSurvival);
    expect(resilient.resilience).toBe("resilient");
  });
});
