import { describe, it, expect } from "vitest";
import { makingChargesRecoveryAnalysis } from "../goldIntel.js";

describe("makingChargesRecoveryAnalysis", () => {
  it("separates the never-recoverable making charges from the real gain on resale", () => {
    // Purchased 20g 22K for 1,20,000 (18,000 was making charges). Melt value today: 1,36,000.
    const result = makingChargesRecoveryAnalysis({ purchasePrice: 120000, makingChargesActual: 18000, value: 136000 });
    expect(result.hasData).toBe(true);
    expect(result.metalOnlyCost).toBe(102000);
    expect(result.realGainAfterMakingCharges).toBe(16000);
    expect(result.grossGrowthIfMakingChargesIgnored).toBe(34000);
    expect(result.makingChargesNeverRecoverable).toBe(18000);
  });

  it("returns hasData:false when making charges weren't recorded", () => {
    expect(makingChargesRecoveryAnalysis({ purchasePrice: 120000, value: 136000 }).hasData).toBe(false);
  });

  it("never crashes on missing/zero fields", () => {
    expect(() => makingChargesRecoveryAnalysis({})).not.toThrow();
    expect(makingChargesRecoveryAnalysis({}).hasData).toBe(false);
  });
});
