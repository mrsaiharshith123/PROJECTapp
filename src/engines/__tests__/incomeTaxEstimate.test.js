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

  it("zero tax at ₹3L new regime boundary", () => {
    const r = estimateIncomeTax({ annualGrossIncome: 300000, regime: "new" });
    expect(r.totalTax).toBe(0);
  });

  it("Section 87A rebate can zero tax at ₹12L new regime", () => {
    const r = estimateIncomeTax({ annualGrossIncome: 1200000, regime: "new" });
    expect(r.totalTax).toBe(0);
    expect(r.rebate87a).toBeGreaterThan(0);
  });

  it("tax applies above ₹12L new regime rebate cap", () => {
    const r = estimateIncomeTax({ annualGrossIncome: 1300000, regime: "new" });
    expect(r.totalTax).toBeGreaterThan(0);
  });

  it("handles undefined income without throwing", () => {
    expect(() => estimateIncomeTax({ annualGrossIncome: undefined, regime: "new" })).not.toThrow();
    const r = estimateIncomeTax({ annualGrossIncome: undefined, regime: "new" });
    expect(Number.isNaN(r.totalTax)).toBe(false);
  });

  it("old regime has higher or equal tax than new regime at ₹15L", () => {
    const newR = estimateIncomeTax({ annualGrossIncome: 1500000, regime: "new" });
    const oldR = estimateIncomeTax({ annualGrossIncome: 1500000, regime: "old" });
    expect(oldR.totalTax).toBeGreaterThanOrEqual(newR.totalTax);
  });
});
