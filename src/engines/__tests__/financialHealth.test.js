import { describe, it, expect } from "vitest";
import { computeFinancialHealthScore } from "../financialHealth.js";

const getEffectiveStatus = (c) => c._status || "pending";

describe("computeFinancialHealthScore", () => {
  it("returns high score when no commitments and healthy buffer", () => {
    const result = computeFinancialHealthScore({
      commitments: [],
      lendings: [],
      income: 80000,
      getEffectiveStatus,
      openRemaining: 0,
      freeMoneyAfterBurden: 80000,
      liquidSavings: 200000,
    });
    expect(result.score).toBeGreaterThan(80);
    expect(result.burdenScore).toBeGreaterThan(80);
    expect(result.improvementPath.length).toBeGreaterThan(0);
  });

  it("does not score excellent when income is fully committed despite no overdues", () => {
    const result = computeFinancialHealthScore({
      commitments: [{ id: 1, _status: "pending", amount: 48500, remainingAmount: 48500, repeatType: "monthly" }],
      lendings: [],
      income: 50000,
      getEffectiveStatus,
      openRemaining: 48500,
      freeMoneyAfterBurden: 1500,
      liquidSavings: 5000,
    });
    expect(result.score).toBeLessThan(75);
    expect(result.burdenScore).toBeLessThan(60);
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
    expect(result.score).toBeLessThan(90);
  });

  it("returns four component scores", () => {
    const result = computeFinancialHealthScore({
      commitments: [{ id: 1, _status: "pending", amount: 20000, remainingAmount: 20000 }],
      lendings: [],
      income: 50000,
      getEffectiveStatus,
      openRemaining: 20000,
      freeMoneyAfterBurden: 30000,
    });
    expect(result.burdenScore).toBeDefined();
    expect(result.behaviourScore).toBeDefined();
    expect(result.bufferScore).toBeDefined();
    expect(result.trajectoryScore).toBeDefined();
    expect(result.tone).toBeTruthy();
  });
});
