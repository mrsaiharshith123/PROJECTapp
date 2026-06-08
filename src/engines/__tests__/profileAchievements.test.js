import { describe, expect, it } from "vitest";
import { buildProfileAchievements } from "../profileAchievements.js";

describe("buildProfileAchievements", () => {
  it("includes wealth milestones and cleared loan bills", () => {
    const items = buildProfileAchievements({
      milestones: [{ id: "nw-1l", labelKey: "netWorth.milestone.1L", achievedAt: 1000, type: "wealth" }],
      goals: [],
      commitments: [
        {
          id: "l1",
          name: "Car loan",
          category: "Loan",
          status: "paid",
          remainingAmount: 0,
          endDate: "2025-01-01",
          updatedAt: 2000,
        },
      ],
      getEffectiveStatus: () => "paid",
      todayStr: "2026-06-08",
      goalCtx: { openRemainingSum: 0, burdenRatio: 0 },
    });
    expect(items.some((i) => i.id === "nw-1l")).toBe(true);
    expect(items.some((i) => i.id === "bill-l1")).toBe(true);
  });
});
