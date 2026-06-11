import { describe, expect, it } from "vitest";
import {
  simulatePrepayment,
  buildPrepaymentBalanceSeries,
  estimateLoanPayoffStressDelta,
} from "../prepayment.js";

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

  it("buildPrepaymentBalanceSeries ends whatIf line sooner with extra", () => {
    const { rows, baselineMonths, acceleratedMonths } = buildPrepaymentBalanceSeries({
      principalOutstanding: 200000,
      annualRatePercent: 10,
      scheduledEmi: 8000,
      extraMonthly: 2000,
    });
    expect(rows.length).toBeGreaterThan(1);
    expect(acceleratedMonths).toBeLessThan(baselineMonths);
    expect(rows[0].baseline).toBe(rows[0].whatIf);
    const lastWhatIf = [...rows].reverse().find((r) => r.whatIf > 0);
    expect(lastWhatIf?.whatIf ?? 0).toBeGreaterThanOrEqual(0);
  });

  it("estimateLoanPayoffStressDelta lowers score after EMI ends", () => {
    const d = estimateLoanPayoffStressDelta({
      monthlyIncome: 100000,
      monthlyBurdenExcludingThisEmi: 30000,
      emi: 15000,
      extraMonthly: 5000,
    });
    expect(d).not.toBeNull();
    expect(d.during).toBeGreaterThan(d.after);
    expect(d.delta).toBeGreaterThan(0);
  });
});
