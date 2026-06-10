import { describe, expect, it } from "vitest";
import { analyzeGoalBalance } from "../goalBalance.js";

describe("analyzeGoalBalance", () => {
  it("flags overlap when many goals and high burden", () => {
    const r = analyzeGoalBalance(
      [
        { type: "save_amount", active: true },
        { type: "education", active: true },
        { type: "wedding", active: true },
      ],
      { burdenRatio: 0.6, freeMoney: 5000 },
    );
    expect(r.insights.some((i) => i.id === "goal-overlap")).toBe(true);
    expect(r.messageKey).toBeTruthy();
  });
});
