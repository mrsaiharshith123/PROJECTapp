import { describe, it, expect } from "vitest";
import { calculateMonthlyEMI as computeEmiFromPrincipal } from "../../utils/repayment/calculations.js";
import { isDebtCommitment } from "../loanPayoffTiming.js";

describe("loanPayoffTiming", () => {
  it("EMI is positive for valid loan inputs", () => {
    const emi = computeEmiFromPrincipal(500000, 8.5, 60);
    expect(emi).toBeGreaterThan(0);
  });

  it("handles zero interest rate", () => {
    const emi = computeEmiFromPrincipal(120000, 0, 12);
    expect(emi).toBeCloseTo(10000, 0);
  });

  it("does not return NaN for edge inputs", () => {
    expect(Number.isNaN(computeEmiFromPrincipal(0, 0, 0))).toBe(false);
  });

  it("identifies debt commitment categories", () => {
    expect(isDebtCommitment({ category: "EMI" })).toBe(true);
    expect(isDebtCommitment({ category: "Rent" })).toBe(false);
  });
});
