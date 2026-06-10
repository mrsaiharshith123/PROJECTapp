import { describe, it, expect } from "vitest";
import { computeFdRdProjection, monthsUntilMaturity } from "../fdRdTracker.js";

describe("fdRdTracker", () => {
  it("projects FD maturity with simple interest", () => {
    const r = computeFdRdProjection({ principal: 100000, annualRate: 7, tenureMonths: 12 });
    expect(r.maturityAmount).toBeGreaterThan(100000);
    expect(r.interestEarned).toBeGreaterThan(0);
  });

  it("projects RD with monthly deposits", () => {
    const r = computeFdRdProjection({
      isRd: true,
      monthlyDeposit: 5000,
      annualRate: 6.5,
      tenureMonths: 12,
    });
    expect(r.totalInvested).toBe(60000);
    expect(r.maturityAmount).toBeGreaterThanOrEqual(60000);
  });

  it("computes months until maturity", () => {
    const left = monthsUntilMaturity("2025-01-15", 12, "2025-06-15");
    expect(left).toBe(7);
  });
});
