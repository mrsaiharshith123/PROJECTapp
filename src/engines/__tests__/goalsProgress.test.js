import { describe, expect, it } from "vitest";
import { computeGoalProgress, computeGoalIntel, goalTypeLabel } from "../goalsProgress.js";

describe("goalsProgress", () => {
  it("computes save_amount progress from saved amount", () => {
    const p = computeGoalProgress(
      { type: "save_amount", targetAmount: 100000 },
      { savedAmountTowardGoal: 25000, openRemainingSum: 0, burdenRatio: 0.3 },
    );
    expect(p).toBeCloseTo(0.25);
  });

  it("computeGoalIntel returns pace and status key", () => {
    const intel = computeGoalIntel(
      { type: "save_amount", targetAmount: 120000, targetDate: "2026-12-31" },
      { savedAmountTowardGoal: 30000, openRemainingSum: 0, burdenRatio: 0.3 },
      "2026-06-10",
    );
    expect(intel.statusKey).toMatch(/^goals\.status\./);
    expect(intel.requiredMonthlyPace).toBeGreaterThan(0);
    expect(intel.daysRemaining).toBeGreaterThan(0);
  });

  it("returns label for known types", () => {
    expect(goalTypeLabel("education")).toContain("Education");
  });
});
