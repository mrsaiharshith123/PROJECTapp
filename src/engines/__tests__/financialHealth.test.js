import { describe, it, expect } from "vitest";
import { computeFinancialHealthScore } from "../financialHealth.js";

const getEffectiveStatus = (c) => c._status || "pending";

describe("computeFinancialHealthScore", () => {
  it("returns 100 excellent when there are no open bills", () => {
    const result = computeFinancialHealthScore({
      commitments: [],
      lendings: [],
      income: 80000,
      getEffectiveStatus,
      openRemaining: 0,
      freeMoneyAfterBurden: 80000,
    });
    expect(result.score).toBe(100);
    expect(result.level).toBe("excellent");
  });

  it("returns 100 when all commitments are paid", () => {
    const result = computeFinancialHealthScore({
      commitments: [{ id: 1, _status: "paid", amount: 5000 }],
      lendings: [],
      income: 50000,
      getEffectiveStatus,
      openRemaining: 0,
      freeMoneyAfterBurden: 50000,
    });
    expect(result.score).toBe(100);
  });

  it("penalizes overdue bills", () => {
    const result = computeFinancialHealthScore({
      commitments: [{ id: 1, _status: "overdue", amount: 3000, remainingAmount: 3000 }],
      lendings: [],
      income: 50000,
      getEffectiveStatus,
      openRemaining: 3000,
      freeMoneyAfterBurden: 47000,
    });
    expect(result.score).toBeLessThan(100);
  });

  it("penalizes high burden vs income", () => {
    const result = computeFinancialHealthScore({
      commitments: [{ id: 1, _status: "pending", amount: 40000, remainingAmount: 40000 }],
      lendings: [],
      income: 50000,
      getEffectiveStatus,
      openRemaining: 40000,
      freeMoneyAfterBurden: 10000,
    });
    expect(result.score).toBeLessThan(90);
  });
});
