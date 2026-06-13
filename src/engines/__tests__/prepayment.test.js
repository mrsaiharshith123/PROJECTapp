import { describe, expect, it } from "vitest";
import {
  simulatePrepayment,
  buildPrepaymentBalanceSeries,
  buildCumulativePaidSeries,
  extrasFromTimingRows,
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

  it("buildCumulativePaidSeries finishes sooner with extra", () => {
    const { rows, baselineMonths, acceleratedMonths, baselineTotalPaid, acceleratedTotalPaid } =
      buildCumulativePaidSeries({
        principalOutstanding: 200000,
        annualRatePercent: 10,
        scheduledEmi: 8000,
        extraMonthly: 2000,
      });
    expect(rows.length).toBeGreaterThan(1);
    expect(acceleratedMonths).toBeLessThan(baselineMonths);
    expect(acceleratedTotalPaid).toBeLessThan(baselineTotalPaid);
    expect(rows[rows.length - 1].baseline).toBe(baselineTotalPaid);
    const mid = rows.find((r) => r.month === acceleratedMonths);
    expect(mid?.whatIf).toBe(acceleratedTotalPaid);
    expect(mid?.whatIf).toBeGreaterThan(0);
    if (acceleratedMonths < baselineMonths) {
      const after = rows.find((r) => r.month === acceleratedMonths + 1);
      expect(after?.whatIf).toBe(acceleratedTotalPaid);
    }
  });

  it("extrasFromTimingRows maps light months by plan offset", () => {
    const map = extrasFromTimingRows([
      { offset: 0, goodForExtra: false, recommendedExtra: 0 },
      { offset: 1, goodForExtra: true, recommendedExtra: 5000 },
      { offset: 2, goodForExtra: true, recommendedExtra: 3000 },
    ]);
    expect(map[1]).toBeUndefined();
    expect(map[2]).toBe(5000);
    expect(map[3]).toBe(3000);
  });

  it("buildPrepaymentBalanceSeries diverges with lumpy extras", () => {
    const { rows, baselineMonths, acceleratedMonths } = buildPrepaymentBalanceSeries({
      principalOutstanding: 500000,
      annualRatePercent: 10,
      scheduledEmi: 83333,
      extraByMonth: { 2: 50000, 3: 50000, 4: 50000 },
    });
    expect(acceleratedMonths).toBeLessThanOrEqual(baselineMonths);
    const diverge = rows.find((r) => r.month > 0 && r.baseline !== r.whatIf);
    expect(diverge).toBeTruthy();
    expect(diverge?.extraPay).toBeGreaterThan(0);
  });
});
