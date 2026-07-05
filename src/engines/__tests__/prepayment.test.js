import { describe, it, expect } from "vitest";
import { computeEmiFromPrincipal, simulatePrepayment } from "../prepayment.js";

describe("prepayment", () => {
  it("EMI is positive for valid loan inputs", () => {
    const emi = computeEmiFromPrincipal(500000, 8.5, 60);
    expect(emi).toBeGreaterThan(0);
  });

  it("extra payment shortens payoff vs baseline", () => {
    const emi = computeEmiFromPrincipal(500000, 8.5, 60);
    const base = simulatePrepayment({
      principalOutstanding: 500000,
      annualRatePercent: 8.5,
      scheduledEmi: emi,
      extraMonthly: 0,
    });
    const extra = simulatePrepayment({
      principalOutstanding: 500000,
      annualRatePercent: 8.5,
      scheduledEmi: emi,
      extraMonthly: 5000,
    });
    expect(extra.acceleratedMonths).toBeLessThan(base.baselineMonths);
  });

  it("does not return NaN for zero principal", () => {
    const r = simulatePrepayment({
      principalOutstanding: 0,
      annualRatePercent: 8,
      scheduledEmi: 0,
      extraMonthly: 0,
    });
    expect(Number.isNaN(r.baselineMonths)).toBe(false);
    expect(Number.isNaN(r.acceleratedMonths)).toBe(false);
  });
});
