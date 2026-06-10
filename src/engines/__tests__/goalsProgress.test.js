import { describe, expect, it } from "vitest";
import { computeGoalProgress, goalTypeLabel } from "../goalsProgress.js";

describe("goalsProgress", () => {
  it("computes save_amount progress from saved amount", () => {
    const p = computeGoalProgress(
      { type: "save_amount", targetAmount: 100000 },
      { savedAmountTowardGoal: 25000, openRemainingSum: 0, burdenRatio: 0.3 },
    );
    expect(p).toBeCloseTo(0.25);
  });

  it("returns label for known types", () => {
    expect(goalTypeLabel("education")).toContain("Education");
  });
});
