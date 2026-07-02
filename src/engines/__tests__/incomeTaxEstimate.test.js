import { describe, it, expect } from "vitest";
import { estimateIncomeTax } from "../incomeTaxEstimate.js";

describe("incomeTaxEstimate", () => {
  it("zero tax for income below basic exemption", () => {
    const r = estimateIncomeTax({ annualGrossIncome: 250000, regime: "new" });
    expect(r.totalTax).toBe(0);
  });

  it("positive tax for high income (new regime)", () => {
    const r = estimateIncomeTax({ annualGrossIncome: 2000000, regime: "new" });
    expect(r.totalTax).toBeGreaterThan(0);
  });

  it("effective rate between 0 and 100", () => {
    const r = estimateIncomeTax({ annualGrossIncome: 1500000, regime: "old" });
    expect(r.effectiveRatePercent).toBeGreaterThanOrEqual(0);
    expect(r.effectiveRatePercent).toBeLessThanOrEqual(100);
  });

  it("no NaN on zero income", () => {
    const r = estimateIncomeTax({ annualGrossIncome: 0 });
    expect(Number.isFinite(r.totalTax)).toBe(true);
  });
});
