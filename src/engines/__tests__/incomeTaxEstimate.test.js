import { describe, it, expect } from "vitest";
import {
  computeMarginalTax,
  estimateIncomeTax,
  computeHraExemption,
  deriveTaxDeductionsFromCommitments,
} from "../incomeTaxEstimate.js";

describe("incomeTaxEstimate", () => {
  it("computes marginal tax on new regime slabs", () => {
    expect(computeMarginalTax(500_000, [
      [400_000, 0],
      [800_000, 0.05],
      [Number.POSITIVE_INFINITY, 0.1],
    ])).toBe(5000);
  });

  it("applies 87A rebate for moderate new-regime salary", () => {
    const r = estimateIncomeTax({ annualGrossIncome: 900_000, regime: "new" });
    expect(r.taxableIncome).toBe(825_000);
    expect(r.totalTax).toBe(0);
    expect(r.takeHomeMonthly).toBeGreaterThan(0);
  });

  it("charges tax above rebate cap income", () => {
    const r = estimateIncomeTax({ annualGrossIncome: 1_500_000, regime: "new" });
    expect(r.totalTax).toBeGreaterThan(0);
    expect(r.effectiveRatePercent).toBeGreaterThan(0);
  });

  it("computes HRA exemption for old regime", () => {
    const hra = computeHraExemption({
      annualSalary: 1_200_000,
      annualHraReceived: 240_000,
      annualRentPaid: 300_000,
      isMetro: true,
    });
    expect(hra).toBeGreaterThan(0);
    expect(hra).toBeLessThanOrEqual(240_000);
  });

  it("derives deductions from commitments", () => {
    const d = deriveTaxDeductionsFromCommitments(
      [
        { category: "SIP", amount: 5000, repeatType: "monthly" },
        { category: "Insurance", amount: 12000, repeatType: "yearly" },
        { category: "Rent", amount: 20000, repeatType: "monthly" },
      ],
      () => "pending",
    );
    expect(d.deduction80c).toBe(60_000);
    expect(d.deduction80d).toBe(12_000);
    expect(d.annualRentPaid).toBe(240_000);
  });

  it("old regime uses 80C deductions", () => {
    const withDed = estimateIncomeTax({
      annualGrossIncome: 1_200_000,
      regime: "old",
      deduction80c: 150_000,
    });
    const bare = estimateIncomeTax({ annualGrossIncome: 1_200_000, regime: "old" });
    expect(withDed.taxableIncome).toBeLessThan(bare.taxableIncome);
    expect(withDed.totalTax).toBeLessThanOrEqual(bare.totalTax);
  });
});
