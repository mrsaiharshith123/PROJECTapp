import { describe, expect, it } from "vitest";
import {
  addContribution,
  computeSharedGoalProgress,
  getContributionSuggestion,
} from "../sharedGoalContribution.js";

describe("computeSharedGoalProgress", () => {
  it("pct is 0 when savedAmount is 0", () => {
    const p = computeSharedGoalProgress({ targetAmount: 20000, savedAmount: 0 }, {});
    expect(p.pct).toBe(0);
    expect(p.saved).toBe(0);
  });
});

describe("addContribution", () => {
  it("increases the right member amount", () => {
    const goal = { memberContributions: { self: 1000, spouse: 500 } };
    expect(addContribution(goal, 2000, "self")).toEqual({ self: 3000, spouse: 500 });
    expect(addContribution(goal, 1500, "spouse")).toEqual({ self: 1000, spouse: 2000 });
  });
});

describe("getContributionSuggestion", () => {
  it("returns null when no targetDate", () => {
    expect(getContributionSuggestion({ targetAmount: 10000, savedAmount: 0 }, {})).toBeNull();
  });
});
