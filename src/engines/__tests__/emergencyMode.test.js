import { describe, it, expect } from "vitest";
import { buildEmergencySnapshot } from "../emergencyMode.js";

describe("buildEmergencySnapshot", () => {
  it("aggregates instant cash, active insurance with claim contact, and money owed to the user", () => {
    const result = buildEmergencySnapshot({
      wealthEntries: [
        { id: "a1", categoryId: "bank", name: "Savings", value: 80000 },
        { id: "a2", categoryId: "fd", name: "FD", value: 200000 },
      ],
      commitments: [
        { id: "c1", category: "Insurance", name: "Health cover", insuranceCompany: "LIC", insuranceClaimContact: "1800-123-456", insuranceSumAssured: 500000 },
        { id: "c2", category: "EMI", name: "Home loan EMI" },
      ],
      lendings: [
        { id: "l1", type: "lent", personName: "Ravi", remainingAmount: 30000 },
        { id: "l2", type: "borrowed", personName: "Priya", remainingAmount: 10000 },
      ],
      getEffectiveStatus: () => "pending",
    });

    expect(result.instantCash).toBe(80000);
    expect(result.within7DaysCash).toBe(280000);
    expect(result.activeInsurance.length).toBe(1);
    expect(result.activeInsurance[0].claimContact).toBe("1800-123-456");
    expect(result.owedToUser).toEqual([{ id: "l1", personName: "Ravi", remainingAmount: 30000 }]);
    expect(result.totalOwedToUser).toBe(30000);
  });

  it("excludes already-paid insurance and settled lendings", () => {
    const result = buildEmergencySnapshot({
      wealthEntries: [],
      commitments: [{ id: "c1", category: "Insurance", name: "Paid up" }],
      lendings: [{ id: "l1", type: "lent", personName: "Ravi", remainingAmount: 0 }],
      getEffectiveStatus: () => "paid",
    });
    expect(result.activeInsurance.length).toBe(0);
    expect(result.owedToUser.length).toBe(0);
  });
});
