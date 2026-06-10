import { describe, expect, it } from "vitest";
import { getExpensePresetsForMode, simulateNewExpense } from "../expenseSimulator.js";

const pending = () => "pending";

describe("expenseSimulator", () => {
  it("returns salaried presets", () => {
    const presets = getExpensePresetsForMode("salaried");
    expect(Object.keys(presets).length).toBeGreaterThan(0);
  });

  it("simulates new monthly expense impact", () => {
    const r = simulateNewExpense({
      commitments: [],
      income: 80000,
      getEffectiveStatus: pending,
      amount: 3000,
      preset: "subscription",
    });
    expect(r.affordability?.tier).toBeTruthy();
  });
});
