import { describe, expect, it } from "vitest";
import { detectNewMilestones } from "../milestones.js";

describe("detectNewMilestones", () => {
  it("detects first ₹1L net worth milestone", () => {
    const fresh = detectNewMilestones(
      { netWorth: 110000, totalDebt: 0, liquidNetWorth: 80000, savingsStreakMonths: 0 },
      [],
    );
    expect(fresh.some((m) => m.id === "nw-1l")).toBe(true);
  });

  it("skips milestones already recorded", () => {
    const existing = [{ id: "nw-1l", type: "wealth", labelKey: "netWorth.milestone.1L", achievedAt: 1, value: 100000 }];
    const fresh = detectNewMilestones(
      { netWorth: 120000, totalDebt: 0, liquidNetWorth: 90000, savingsStreakMonths: 0 },
      existing,
    );
    expect(fresh.some((m) => m.id === "nw-1l")).toBe(false);
  });
});
