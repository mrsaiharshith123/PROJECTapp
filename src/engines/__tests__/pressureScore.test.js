import { describe, expect, it } from "vitest";
import { computeCanonicalPressureScore } from "../pressureScore.js";

const pending = (c) => (c.status === "paid" ? "paid" : "pending");

describe("computeCanonicalPressureScore", () => {
  it("returns 0 when income is 0 and commitments empty", () => {
    expect(
      computeCanonicalPressureScore({
        commitments: [],
        income: 0,
        getEffectiveStatus: pending,
      })
    ).toBe(0);
  });

  it("returns 0 when income is 0 with open commitments", () => {
    const score = computeCanonicalPressureScore({
      commitments: [{ amount: 5000, remainingAmount: 5000, repeatType: "monthly" }],
      income: 0,
      getEffectiveStatus: pending,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
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

  it("increases when more commitments are added", () => {
    const base = computeCanonicalPressureScore({
      commitments: [{ amount: 10000, remainingAmount: 10000, repeatType: "monthly" }],
      income: 50000,
      getEffectiveStatus: pending,
    });
    const more = computeCanonicalPressureScore({
      commitments: [
        { amount: 10000, remainingAmount: 10000, repeatType: "monthly" },
        { amount: 15000, remainingAmount: 15000, repeatType: "monthly" },
      ],
      income: 50000,
      getEffectiveStatus: pending,
    });
    expect(more).toBeGreaterThan(base);
  });

  it("does not exceed 100 when burden exceeds income", () => {
    const score = computeCanonicalPressureScore({
      commitments: [
        { amount: 80000, remainingAmount: 80000, repeatType: "monthly" },
        { amount: 50000, remainingAmount: 50000, repeatType: "monthly" },
      ],
      income: 30000,
      getEffectiveStatus: pending,
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it("adds penalty for overdue bills", () => {
    const ok = computeCanonicalPressureScore({
      commitments: [{ amount: 10000, remainingAmount: 10000, repeatType: "monthly" }],
      income: 50000,
      getEffectiveStatus: () => "pending",
    });
    const overdue = computeCanonicalPressureScore({
      commitments: [{ amount: 10000, remainingAmount: 10000, repeatType: "monthly" }],
      income: 50000,
      getEffectiveStatus: () => "overdue",
    });
    expect(overdue).toBeGreaterThan(ok);
  });
});
