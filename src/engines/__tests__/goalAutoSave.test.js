import { describe, expect, it } from "vitest";
import { isSalaryCreditToday, planGoalAutoSave } from "../goalAutoSave.js";

describe("isSalaryCreditToday", () => {
  it("matches salary credit day", () => {
    expect(isSalaryCreditToday("2026-06-05", 5)).toBe(true);
    expect(isSalaryCreditToday("2026-06-06", 5)).toBe(false);
  });
});

describe("planGoalAutoSave", () => {
  it("returns credits on salary day when not yet run", () => {
    const r = planGoalAutoSave({
      rules: [{ goalId: 1, amount: 5000 }],
      goals: [{ id: 1, type: "save_amount", title: "Home", active: true }],
      todayStr: "2026-06-05",
      salaryCreditDay: 5,
      lastRunDate: null,
    });
    expect(r.shouldRun).toBe(true);
    expect(r.credits).toHaveLength(1);
    expect(r.credits[0].amount).toBe(5000);
  });

  it("skips when already run today", () => {
    const r = planGoalAutoSave({
      rules: [{ goalId: 1, amount: 5000 }],
      goals: [{ id: 1, type: "save_amount", title: "Home" }],
      todayStr: "2026-06-05",
      salaryCreditDay: 5,
      lastRunDate: "2026-06-05",
    });
    expect(r.shouldRun).toBe(false);
  });
});
