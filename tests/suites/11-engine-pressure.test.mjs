import { describe, it, expect } from "vitest";
import { computePressureAnalysis } from "../../src/engines/pressureScore.js";

describe("ENGINE: pressureScore", () => {
  it("[P1] returns score 0–100 for salaried baseline", () => {
    const out = computePressureAnalysis({
      commitments: [{ amount: 10000, remainingAmount: 10000, repeatType: "monthly", category: "EMI" }],
      income: 50000,
      getEffectiveStatus: () => "pending",
    });
    expect(out.score).toBeGreaterThanOrEqual(0);
    expect(out.score).toBeLessThanOrEqual(100);
  });
});
