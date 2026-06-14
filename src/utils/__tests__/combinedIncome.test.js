import { describe, expect, it } from "vitest";
import { totalMonthlyIncome } from "../combinedIncome.js";

describe("totalMonthlyIncome", () => {
  it("counts primary + side income in single household", () => {
    const total = totalMonthlyIncome({
      userMode: "salaried",
      householdScope: "single",
      monthlyIncome: 100000,
      secondaryMonthlyIncome: 25000,
      sideIncomes: [{ monthlyAmount: 15000 }],
    });
    expect(total).toBe(115000);
  });

  it("counts secondary income only in family household", () => {
    const total = totalMonthlyIncome({
      userMode: "salaried",
      householdScope: "family",
      monthlyIncome: 100000,
      secondaryMonthlyIncome: 25000,
      sideIncomes: [{ monthlyAmount: 15000 }],
    });
    expect(total).toBe(140000);
  });
});
