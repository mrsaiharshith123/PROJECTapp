import { describe, expect, it } from "vitest";
import {
  computeCanonicalPressureScore,
  computePressureAnalysis,
  totalOverdueAmount,
  linearRegressionSlope,
} from "../pressureScore.js";

const pending = (c) => (c.status === "paid" ? "paid" : "pending");

describe("computeCanonicalPressureScore", () => {
  it("returns 0 when income is 0 and commitments empty", () => {
    expect(
      computeCanonicalPressureScore({
        commitments: [],
        income: 0,
        getEffectiveStatus: pending,
      }),
    ).toBe(0);
  });

  it("stays between 0 and 100 for normal inputs", () => {
    const score = computeCanonicalPressureScore({
      commitments: [
        { amount: 20000, remainingAmount: 20000, repeatType: "monthly" },
        { amount: 5000, remainingAmount: 5000, repeatType: "monthly" },
      ],
      income: 50000,
      getEffectiveStatus: pending,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("weights large overdue amounts more than small ones", () => {
    const small = computeCanonicalPressureScore({
      commitments: [{ amount: 30, remainingAmount: 30, repeatType: "monthly" }],
      income: 100000,
      getEffectiveStatus: () => "overdue",
    });
    const large = computeCanonicalPressureScore({
      commitments: [{ amount: 45000, remainingAmount: 45000, repeatType: "monthly" }],
      income: 100000,
      getEffectiveStatus: () => "overdue",
    });
    expect(large).toBeGreaterThan(small);
  });

  it("exposes pressure analysis outputs", () => {
    const analysis = computePressureAnalysis({
      commitments: [
        { id: "1", amount: 10000, remainingAmount: 10000, repeatType: "monthly", category: "EMI", dueDate: "2026-06-05" },
        { id: "2", amount: 8000, remainingAmount: 8000, repeatType: "monthly", category: "Rent", dueDate: "2026-06-06" },
        { id: "3", amount: 5000, remainingAmount: 5000, repeatType: "monthly", category: "Utility", dueDate: "2026-06-07" },
      ],
      income: 50000,
      getEffectiveStatus: pending,
      todayStr: "2026-06-01",
      monthlySnapshots: [
        { month: "2026-04", pressureScore: 50 },
        { month: "2026-05", pressureScore: 55 },
        { month: "2026-06", pressureScore: 62 },
      ],
    });
    expect(analysis.pressureDrivers.length).toBeGreaterThan(0);
    expect(analysis.clusterWeeks.length).toBeGreaterThan(0);
    expect(analysis.trendDirection).toBe("worsening");
    expect(analysis.narrativeLines.length).toBeGreaterThan(0);
  });
});

describe("pressure helpers", () => {
  it("sums overdue amounts", () => {
    const amt = totalOverdueAmount(
      [
        { remainingAmount: 30 },
        { remainingAmount: 45000 },
      ],
      (_c) => "overdue",
    );
    expect(amt).toBe(45030);
  });

  it("computes positive regression slope", () => {
    expect(linearRegressionSlope([40, 50, 60])).toBeGreaterThan(0);
  });
});
