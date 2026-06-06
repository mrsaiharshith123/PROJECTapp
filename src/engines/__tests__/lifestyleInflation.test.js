import { describe, expect, it } from "vitest";
import { detectLifestyleInflation } from "../lifestyleInflation.js";

const pending = () => "pending";

describe("detectLifestyleInflation", () => {
  it("returns no inflation trend when commitments have no payment history", () => {
    const r = detectLifestyleInflation([], pending);
    expect(r.hasTrend).toBe(false);
    expect(r.insights).toEqual([]);
  });

  it("returns no inflation when only one month has recurring paid data", () => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const r = detectLifestyleInflation(
      [
        {
          repeatType: "monthly",
          payments: [{ date: `${key}-05`, amount: 2000 }],
        },
      ],
      pending
    );
    expect(r.hasTrend).toBe(false);
  });

  it("detects inflation when recent recurring spend is significantly higher", () => {
    const d = new Date();
    const m1 = new Date(d.getFullYear(), d.getMonth() - 2, 1);
    const m2 = new Date(d.getFullYear(), d.getMonth(), 1);
    const k1 = `${m1.getFullYear()}-${String(m1.getMonth() + 1).padStart(2, "0")}`;
    const k2 = `${m2.getFullYear()}-${String(m2.getMonth() + 1).padStart(2, "0")}`;
    const r = detectLifestyleInflation(
      [
        {
          repeatType: "monthly",
          category: "Subscription",
          amount: 500,
          priority: "low",
          payments: [
            { date: `${k1}-10`, amount: 1000 },
            { date: `${k2}-10`, amount: 2000 },
          ],
        },
      ],
      pending
    );
    expect(r.growthPercent).toBeGreaterThanOrEqual(15);
    expect(r.insights.length).toBeGreaterThan(0);
  });

  it("does not throw on null commitments input", () => {
    expect(() => detectLifestyleInflation(null, pending)).not.toThrow();
    const r = detectLifestyleInflation(null, pending);
    expect(r.hasTrend).toBe(false);
  });
});
