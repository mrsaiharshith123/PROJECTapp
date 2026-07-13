import { describe, it, expect } from "vitest";
import { isInformalHighRateDebt, payoffPriorityScore, rankPayoffOrder } from "../payoffPriority.js";

const getEffectiveStatus = () => "pending";

describe("isInformalHighRateDebt / payoffPriorityScore", () => {
  it("flags a commitment with isInformalLender set", () => {
    expect(isInformalHighRateDebt({ isInformalLender: true })).toBe(true);
    expect(isInformalHighRateDebt({ isInformalLender: false })).toBe(false);
    expect(isInformalHighRateDebt({})).toBe(false);
  });

  it("always ranks informal lender debt first, regardless of amount, ahead of a much larger overdue formal loan", () => {
    const informal = {
      id: "informal",
      isInformalLender: true,
      remainingAmount: 5000,
      category: "Loan",
      priority: "low",
    };
    const formal = {
      id: "formal",
      isInformalLender: false,
      remainingAmount: 2000000,
      category: "EMI",
      priority: "critical",
      annualInterestRate: 12,
    };
    const order = rankPayoffOrder([formal, informal], getEffectiveStatus, "2025-06-01");
    expect(order[0].commitment.id).toBe("informal");
    expect(order[0].rank).toBe(1);
  });

  it("informal-lender score dominates the total score by a wide margin", () => {
    const scoreInformal = payoffPriorityScore({ isInformalLender: true, remainingAmount: 1000, category: "Loan" }, getEffectiveStatus, "2025-06-01");
    const scoreFormal = payoffPriorityScore({ isInformalLender: false, remainingAmount: 5000000, category: "Credit Card", priority: "critical", annualInterestRate: 36 }, getEffectiveStatus, "2025-06-01");
    expect(scoreInformal).toBeGreaterThan(scoreFormal);
  });
});
