import { describe, expect, it } from "vitest";
import { computeFamilyStabilityScore } from "../familyStabilityScore.js";
import { analyzeFamilyDependency } from "../familyDependency.js";
import { buildFamilyCommandCenter } from "../familyCommandCenter.js";

describe("familyStabilityScore", () => {
  it("lowers score when income is concentrated and dependents are high", () => {
    const score = computeFamilyStabilityScore({
      settings: {
        monthlyIncome: 80000,
        secondaryMonthlyIncome: 0,
        dependents: 3,
        householdMembers: [
          { id: "owner", role: "owner", incomeShare: 1 },
          { id: "d1", role: "dependent", incomeShare: 0 },
        ],
      },
      commitments: [{ remainingAmount: 50000, repeat: "monthly", status: "pending" }],
      getEffectiveStatus: () => "pending",
      emergencyPct: 20,
      survivalMonths: 2,
      overdueCount: 1,
    });
    expect(score.score).toBeLessThan(60);
    expect(score.incomeConcentrationPct).toBe(100);
  });
});

describe("familyDependency", () => {
  it("flags overloaded single-earner households", () => {
    const dep = analyzeFamilyDependency({
      settings: {
        monthlyIncome: 90000,
        secondaryMonthlyIncome: 0,
        dependents: 3,
        householdMembers: [{ id: "owner", role: "owner" }, { id: "d1", role: "dependent" }],
      },
      commitments: [
        { remainingAmount: 60000, householdPayer: "primary", status: "pending" },
      ],
      getEffectiveStatus: () => "pending",
    });
    expect(dep.overloaded).toBe(true);
    expect(dep.insights.some((i) => i.id === "family-income-concentration")).toBe(true);
  });
});

describe("familyCommandCenter", () => {
  it("returns unified stability and insights", () => {
    const cmd = buildFamilyCommandCenter({
      settings: {
        monthlyIncome: 100000,
        secondaryMonthlyIncome: 40000,
        dependents: 2,
        liquidSavings: 50000,
        householdMembers: [{ id: "owner", role: "owner" }],
      },
      commitments: [
        {
          name: "Rent",
          category: "Rent",
          remainingAmount: 25000,
          dueDate: "2026-08-01",
          status: "pending",
          payments: [{ amount: 25000, date: "2026-05-01" }],
          householdPayer: "primary",
        },
      ],
      goals: [{ id: "g1", label: "Education fund", status: "active" }],
      getEffectiveStatus: () => "pending",
      todayStr: "2026-06-14",
      survivalMonths: 4,
      overdueCount: 0,
    });
    expect(cmd.stability.score).toBeGreaterThan(0);
    expect(cmd.insights.length).toBeGreaterThan(0);
    expect(cmd.sharedGoals).toHaveLength(1);
  });
});
