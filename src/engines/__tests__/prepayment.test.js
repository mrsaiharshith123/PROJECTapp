import { describe, expect, it } from "vitest";
import { simulatePrepayment } from "../prepayment.js";

describe("simulatePrepayment", () => {
  it("extra payment reduces months and interest", () => {
    const r = simulatePrepayment({
      principalOutstanding: 500000,
      annualRatePercent: 10,
      scheduledEmi: 10000,
      extraMonthly: 5000,
    });
    expect(r.monthsSaved).toBeGreaterThan(0);
    expect(r.interestSaved).toBeGreaterThan(0);
  });
});
