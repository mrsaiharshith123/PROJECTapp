import { describe, expect, it } from "vitest";
import { computeCashFlowIntel } from "../cashFlow.js";

const pending = () => "pending";

describe("computeCashFlowIntel", () => {
  it("computes savings rate and pressure level", () => {
    const r = computeCashFlowIntel({
      monthlyIncome: 80000,
      commitments: [{ amount: 20000, repeatType: "monthly", remainingAmount: 0 }],
      getEffectiveStatus: pending,
    });
    expect(r.monthlyObligations).toBe(20000);
    expect(r.savingsRate).toBeGreaterThan(0);
    expect(r.pressureLevel).toMatch(/calm|tight|strained/);
  });
});
