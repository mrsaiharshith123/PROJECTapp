import { describe, it, expect } from "vitest";
import { normalizeHouseholdMembers, computeHouseholdMetrics } from "../householdEntity.js";

describe("householdEntity", () => {
  it("normalizes invalid member rows", () => {
    const members = normalizeHouseholdMembers([{ label: "Spouse", role: "spouse" }]);
    expect(members[0].role).toBe("spouse");
    expect(members[0].id).toBeTruthy();
  });

  it("defaults to owner when empty", () => {
    const members = normalizeHouseholdMembers(null);
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe("owner");
  });

  it("computes combined household metrics", () => {
    const metrics = computeHouseholdMetrics({
      settings: {
        monthlyIncome: 100_000,
        householdMembers: [
          { id: "owner", label: "You", role: "owner", incomeShare: 1 },
          { id: "kid", label: "Child", role: "dependent", incomeShare: 0 },
        ],
      },
      commitments: [{ amount: 20_000, repeatType: "monthly", status: "pending" }],
      getEffectiveStatus: (c) => c.status,
      todayStr: "2026-06-01",
    });
    expect(metrics.memberCount).toBe(2);
    expect(metrics.combinedIncome).toBe(100_000);
    expect(metrics.combinedBurden).toBeGreaterThan(0);
    expect(metrics.stabilityLabel).toBeTruthy();
  });
});
