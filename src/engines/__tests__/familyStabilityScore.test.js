import { describe, expect, it } from "vitest";
import { computeFamilyStabilityScore } from "../familyStabilityScore.js";

describe("computeFamilyStabilityScore", () => {
  it("penalizes concentrated income and low emergency cover", () => {
    const score = computeFamilyStabilityScore({
      settings: {
        monthlyIncome: 70000,
        secondaryMonthlyIncome: 0,
        dependents: 2,
        householdMembers: [
          { id: "owner", label: "You", role: "owner", incomeShare: 1 },
          { id: "spouse", label: "Partner", role: "spouse", incomeShare: 0 },
          { id: "child", label: "Child", role: "dependent", incomeShare: 0 },
        ],
      },
      commitments: [{ remainingAmount: 45000, repeat: "monthly" }],
      getEffectiveStatus: () => "pending",
      emergencyPct: 15,
      survivalMonths: 2.5,
      overdueCount: 2,
    });
    expect(score.score).toBeLessThan(55);
    expect(score.tier).toBe("fragile");
  });
});
