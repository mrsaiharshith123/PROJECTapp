import { describe, it, expect } from "vitest";
import { chitPayout, computeChitIrr } from "../chitFund.js";

describe("chitFund", () => {
  it("payout is less than chit value when discount is applied", () => {
    const payout = chitPayout(100000, 15000);
    expect(payout).toBeLessThan(100000);
    expect(payout).toBeGreaterThan(0);
  });

  it("IRR is finite for typical cash flows", () => {
    const irr = computeChitIrr([-10000, -10000, 50000, -10000, -10000]);
    expect(Number.isFinite(irr.monthlyIrr)).toBe(true);
    expect(Number.isFinite(irr.annualIrrPercent)).toBe(true);
  });

  it("returns null IRR for insufficient cash flows", () => {
    expect(computeChitIrr([10000])).toBeNull();
  });
});
