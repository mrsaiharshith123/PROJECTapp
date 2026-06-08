import { describe, it, expect } from "vitest";
import { computeSalaryBreakdown } from "../salaryBreakdown.js";

const pending = () => "pending";

describe("computeSalaryBreakdown", () => {
  it("separates recurring bills from logged variable spend", () => {
    const result = computeSalaryBreakdown(
      [{ amount: 2000, remainingAmount: 2000, repeatType: "monthly", category: "Subscription" }],
      50000,
      pending,
      {
        todayStr: "2026-06-15",
        dailySpends: [{ id: "s1", amount: 1500, date: "2026-06-10", label: "Swiggy" }],
      },
    );
    expect(result.recurringMonthly).toBe(2000);
    expect(result.loggedSpendThisMonth).toBe(1500);
    expect(result.variableMonthly).toBe(1500);
    expect(result.freeCash).toBe(46500);
  });
});
