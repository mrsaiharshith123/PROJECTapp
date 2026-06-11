import { describe, expect, it } from "vitest";
import { computeDebtHealth } from "../debtHealth.js";

const pending = () => "pending";

describe("computeDebtHealth", () => {
  it("summarises liability entries and EMI load", () => {
    const r = computeDebtHealth({
      liabilityEntries: [{ id: "l1", type: "liability", categoryId: "credit_card", value: 50000, label: "Card" }],
      commitments: [{ amount: 15000, repeatType: "monthly", remainingAmount: 0, category: "EMI" }],
      monthlyIncome: 80000,
      getEffectiveStatus: pending,
    });
    expect(r.totalDebt).toBe(50000);
    expect(r.pressureLevel).toBeTruthy();
  });
});
