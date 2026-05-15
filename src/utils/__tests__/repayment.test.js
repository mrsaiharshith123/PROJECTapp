import { describe, it, expect } from "vitest";
import {
  calculateMonthlyEMI,
  calculateSimpleInterest,
  generateRepaymentSchedule,
} from "../repayment/index.js";

describe("repayment engine", () => {
  it("calculates monthly EMI with interest", () => {
    const emi = calculateMonthlyEMI(100000, 12, 12);
    expect(emi).toBeGreaterThan(8800);
    expect(emi).toBeLessThan(9000);
  });

  it("calculates simple interest", () => {
    const i = calculateSimpleInterest(100000, 12, 12);
    expect(i).toBe(12000);
  });

  it("generates repayment schedule rows", () => {
    const rows = generateRepaymentSchedule({
      principalAmount: 12000,
      interestRate: 12,
      interestType: "simple",
      startDate: "2026-06-01",
      endDate: "2026-11-01",
      repaymentFrequency: "monthly",
      repaymentType: "monthly",
      todayStr: "2026-05-15",
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].installmentNumber).toBe(1);
    expect(rows[0].totalPayment).toBeGreaterThan(0);
  });
});
