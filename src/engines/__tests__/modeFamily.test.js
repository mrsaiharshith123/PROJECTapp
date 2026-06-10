import { describe, expect, it } from "vitest";
import { computeFamilyPressure } from "../modeFamily.js";

const pending = () => "pending";

describe("computeFamilyPressure", () => {
  it("lowers family pressure score with more dependents", () => {
    const base = computeFamilyPressure(
      [{ amount: 30000, repeatType: "monthly", remainingAmount: 0 }],
      100000,
      pending,
      0,
    );
    const withDeps = computeFamilyPressure(
      [{ amount: 30000, repeatType: "monthly", remainingAmount: 0 }],
      100000,
      pending,
      3,
    );
    expect(withDeps.familyPressureScore).toBeLessThanOrEqual(base.familyPressureScore);
    expect(base.householdBurden).toBe(30000);
  });
});
