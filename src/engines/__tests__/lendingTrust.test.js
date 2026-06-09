import { describe, it, expect } from "vitest";
import { analyzeLendingTrust, trustScoreToTone } from "../lendingTrust.js";

describe("lendingTrust behavioral", () => {
  it("detects consistently late pattern", () => {
    const row = {
      displayName: "Ravi",
      successfulRepayments: 2,
      delayedRepayments: 3,
      completedCycles: 1,
      totalDeals: 2,
    };
    const lendings = [
      {
        dueDate: "2026-01-01",
        payments: [
          { date: "2026-01-06", amount: 1000, onTime: false },
          { date: "2026-02-05", amount: 1000, onTime: false },
        ],
        remainingAmount: 0,
        totalAmount: 2000,
      },
    ];
    const analysis = analyzeLendingTrust(row, lendings);
    expect(analysis.avgDaysLate).toBeGreaterThan(0);
    expect(analysis.narrativeLines.length).toBeGreaterThan(0);
    expect(analysis.tone).toBeTruthy();
  });

  it("returns semantic tone not CSS", () => {
    expect(trustScoreToTone(85)).toBe("success");
    expect(trustScoreToTone(85)).not.toMatch(/bg-/);
  });
});
