import { describe, expect, it } from "vitest";
import { analyzeBond } from "../bondAnalyzer.js";

describe("analyzeBond", () => {
  it("returns stronger recommendation for healthy real return and salary fit", () => {
    const r = analyzeBond({
      amount: 100000,
      faceValue: 100000,
      purchasePrice: 85000,
      couponRatePct: 10,
      yearsToMaturity: 5,
      taxRatePct: 10,
      inflationPct: 5,
      monthlyIncome: 120000,
    });
    expect(r.recommendation).toBe("Good");
    expect(r.realReturnPct).toBeGreaterThan(0);
  });

  it("flags weak investment when affordability is too high", () => {
    const r = analyzeBond({
      amount: 240000,
      faceValue: 240000,
      purchasePrice: 240000,
      couponRatePct: 6,
      yearsToMaturity: 2,
      taxRatePct: 30,
      inflationPct: 6,
      monthlyIncome: 20000,
    });
    expect(r.recommendation).toBe("Not good");
    expect(r.affordabilityPct).toBeGreaterThan(30);
  });
});
