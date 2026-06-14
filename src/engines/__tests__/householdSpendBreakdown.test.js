import { describe, expect, it } from "vitest";
import { computeHouseholdSpendBreakdown } from "../householdSpendBreakdown.js";

const status = () => "due";

describe("householdSpendBreakdown", () => {
  it("aggregates bills and variable spend by member tag", () => {
    const commitments = [
      { remainingAmount: 5000, repeat: "monthly", forMember: "self" },
      { remainingAmount: 3000, repeat: "monthly", forMember: "spouse" },
    ];
    const dailySpends = [
      { date: "2026-06-10", amount: 400, forMember: "child" },
      { date: "2026-06-11", amount: 200 },
    ];

    const rows = computeHouseholdSpendBreakdown(commitments, dailySpends, "2026-06-15", status);
    const self = rows.find((r) => r.id === "self");
    const spouse = rows.find((r) => r.id === "spouse");
    const child = rows.find((r) => r.id === "child");

    expect(self?.bills).toBe(5000);
    expect(spouse?.bills).toBe(3000);
    expect(child?.variable).toBe(400);
    expect(rows.some((r) => r.id === "shared" && r.variable === 200)).toBe(true);
  });

  it("skips paid commitments", () => {
    const commitments = [{ remainingAmount: 9000, repeat: "monthly", forMember: "self" }];
    const rows = computeHouseholdSpendBreakdown(commitments, [], "2026-06-15", () => "paid");
    expect(rows).toHaveLength(0);
  });
});
