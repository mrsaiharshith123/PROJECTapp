import { describe, expect, it } from "vitest";
import { computeMomentumScore } from "../momentumScore.js";

const status =
  (map = {}) =>
  (c) =>
    map[c.id] || "pending";

describe("computeMomentumScore", () => {
  it("score is between 0 and 10", () => {
    const m = computeMomentumScore({ monthlySnapshots: [], commitments: [], getEffectiveStatus: status() });
    expect(m.score).toBeGreaterThanOrEqual(0);
    expect(m.score).toBeLessThanOrEqual(10);
  });

  it("falling pressure trend increases score", () => {
    const m = computeMomentumScore({
      monthlySnapshots: [
        { month: "2026-04", pressureScore: 60, overdueSum: 0 },
        { month: "2026-05", pressureScore: 50, overdueSum: 0 },
        { month: "2026-06", pressureScore: 45, overdueSum: 0 },
      ],
      commitments: [{ id: "a", amount: 1000 }],
      getEffectiveStatus: status({ a: "paid" }),
    });
    expect(m.signals.some((s) => s.type === "pressure_down")).toBe(true);
    expect(m.score).toBeGreaterThan(5);
  });

  it("overdue commitments decrease score", () => {
    const m = computeMomentumScore({
      monthlySnapshots: [],
      commitments: [{ id: "a", amount: 1000 }],
      getEffectiveStatus: status({ a: "overdue" }),
    });
    expect(m.signals.some((s) => s.type === "overdue")).toBe(true);
    expect(m.score).toBeLessThan(5);
  });

  it("all paid adds all_clear signal", () => {
    const m = computeMomentumScore({
      monthlySnapshots: [],
      commitments: [{ id: "a", amount: 1000 }],
      getEffectiveStatus: status({ a: "paid" }),
    });
    expect(m.signals.some((s) => s.type === "all_clear")).toBe(true);
  });
});
