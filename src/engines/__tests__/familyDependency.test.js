import { describe, expect, it } from "vitest";
import { analyzeFamilyDependency } from "../familyDependency.js";

describe("analyzeFamilyDependency", () => {
  it("detects single-earner risk with dependents", () => {
    const dep = analyzeFamilyDependency({
      settings: {
        monthlyIncome: 80000,
        secondaryMonthlyIncome: 0,
        dependents: 2,
        householdMembers: [{ id: "o", role: "owner" }],
      },
      commitments: [{ remainingAmount: 40000, householdPayer: "primary" }],
      getEffectiveStatus: () => "pending",
    });
    expect(dep.insights.some((i) => i.id === "family-single-earner-risk")).toBe(true);
  });
});
