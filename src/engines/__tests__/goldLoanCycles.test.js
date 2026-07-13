import { describe, it, expect } from "vitest";
import { analyzeGoldLoanCycles } from "../goldLoanCycles.js";

describe("analyzeGoldLoanCycles", () => {
  it("computes lifetime interest across repeat pawn/redeem cycles", () => {
    const cycles = [
      { id: "c1", pawnDate: "2023-01-01", amount: 100000, interestRate: 24, redemptionDate: "2023-07-01" },
      { id: "c2", pawnDate: "2024-01-01", amount: 150000, interestRate: 24, redemptionDate: "2024-04-01" },
    ];
    const result = analyzeGoldLoanCycles(cycles, "2025-01-01");
    expect(result.cycleCount).toBe(2);
    expect(result.isRepeatCredit).toBe(true);
    // c1: 100000 * 0.24 * 6/12 = 12000; c2: 150000 * 0.24 * 3/12 = 9000
    expect(result.totalInterestPaid).toBe(21000);
    expect(result.hasActivePawns).toBe(false);
  });

  it("treats an unredeemed cycle as currently active and still accrues interest to today", () => {
    const cycles = [{ id: "c1", pawnDate: "2024-07-01", amount: 50000, interestRate: 24 }];
    const result = analyzeGoldLoanCycles(cycles, "2025-01-01");
    expect(result.hasActivePawns).toBe(true);
    expect(result.currentlyPawnedAmount).toBe(50000);
    // 6 months held: 50000 * 0.24 * 6/12 = 6000
    expect(result.totalInterestPaid).toBe(6000);
  });

  it("a single cycle is not flagged as repeat credit", () => {
    const cycles = [{ id: "c1", pawnDate: "2024-01-01", amount: 50000, interestRate: 24, redemptionDate: "2024-06-01" }];
    const result = analyzeGoldLoanCycles(cycles, "2025-01-01");
    expect(result.isRepeatCredit).toBe(false);
  });

  it("never crashes on empty/malformed input", () => {
    expect(() => analyzeGoldLoanCycles(undefined, "2025-01-01")).not.toThrow();
    expect(() => analyzeGoldLoanCycles([{ amount: 0 }], "2025-01-01")).not.toThrow();
    expect(analyzeGoldLoanCycles([], "2025-01-01").cycleCount).toBe(0);
  });
});
