import { describe, it, expect } from "vitest";
import { computeLendingOpportunityCost } from "../lendingOpportunityCost.js";
import { findAnniversaryReflections } from "../anniversaryReflections.js";
import { computeSuccessionCompleteness } from "../successionCompleteness.js";
import { computeCostPerUse, subscriptionsDueForUsageCheckIn } from "../costPerUse.js";
import { buildBillNegotiationScorecard } from "../billNegotiationScorecard.js";
import { scanDocumentExpiry } from "../documentExpiryRadar.js";

describe("computeLendingOpportunityCost", () => {
  it("estimates foregone FD interest for an interest-free loan lent 8 months ago", () => {
    const lendings = [{ id: "l1", type: "lent", personName: "Ravi", principalAmount: 200000, interestRate: 0, startDate: "2024-05-01" }];
    const result = computeLendingOpportunityCost(lendings, 7, "2025-01-01");
    // 200000 * 0.07 * 8/12 = 9333
    expect(result.rows[0].foregoneInterest).toBe(9333);
  });

  it("ignores loans that already carry interest", () => {
    const lendings = [{ id: "l1", type: "lent", personName: "Ravi", principalAmount: 200000, interestRate: 5, startDate: "2024-05-01" }];
    expect(computeLendingOpportunityCost(lendings, 7, "2025-01-01").rows.length).toBe(0);
  });
});

describe("findAnniversaryReflections", () => {
  it("fires only in the purchase month, for entries with a recorded purchase year", () => {
    const entries = [
      { id: "a1", name: "Flat", purchaseYear: 2023, purchaseMonth: 6, purchasePrice: 5000000, value: 5500000 },
      { id: "a2", name: "Gold", purchaseYear: 2024, purchaseMonth: 1, purchasePrice: 100000, value: 110000 },
    ];
    const results = findAnniversaryReflections(entries, new Date(2025, 5, 15)); // June 2025
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("a1");
    expect(results[0].yearsAgo).toBe(2);
    expect(results[0].growth).toBe(500000);
  });
});

describe("computeSuccessionCompleteness", () => {
  it("counts only nominee-relevant categories and reports missing ones by name", () => {
    const entries = [
      { id: "a1", kind: "asset", categoryId: "bank", name: "SBI", nomineeSet: true },
      { id: "a2", kind: "asset", categoryId: "fd", name: "FD1" },
      { id: "a3", kind: "asset", categoryId: "cash", name: "Wallet cash" }, // not nominee-relevant
    ];
    const result = computeSuccessionCompleteness(entries);
    expect(result.total).toBe(2);
    expect(result.completed).toBe(1);
    expect(result.pct).toBe(50);
    expect(result.missing.map((m) => m.name)).toEqual(["FD1"]);
  });
});

describe("computeCostPerUse / subscriptionsDueForUsageCheckIn", () => {
  it("computes cost-per-use and flags poor value subscriptions", () => {
    const commitments = [
      { id: "c1", category: "Subscription", repeatType: "monthly", amount: 800, usageCount: 2 },
      { id: "c2", category: "Subscription", repeatType: "monthly", amount: 200, usageCount: 20 },
    ];
    const result = computeCostPerUse(commitments);
    expect(result.rows[0].costPerUse).toBe(400);
    expect(result.poorValue.map((r) => r.id)).toEqual(["c1"]);
  });

  it("flags subscriptions never usage-logged as due for check-in", () => {
    const commitments = [{ id: "c1", category: "Subscription", repeatType: "monthly", amount: 500 }];
    expect(subscriptionsDueForUsageCheckIn(commitments, "2025-01-01").length).toBe(1);
  });
});

describe("buildBillNegotiationScorecard", () => {
  it("flags a loyal bill (12+ months) with an estimated savings figure", () => {
    const created = new Date();
    created.setFullYear(created.getFullYear() - 3);
    const commitments = [{ id: "c1", name: "Internet", category: "Utility", repeatType: "monthly", amount: 1200, createdAt: created.getTime() }];
    const result = buildBillNegotiationScorecard(commitments);
    expect(result.rows.length).toBe(1);
    expect(result.rows[0].estimatedMonthlySavings).toBeGreaterThan(0);
  });

  it("does not flag a recently-added bill", () => {
    const commitments = [{ id: "c1", name: "New", category: "Utility", repeatType: "monthly", amount: 1200, createdAt: Date.now() }];
    expect(buildBillNegotiationScorecard(commitments).rows.length).toBe(0);
  });
});

describe("scanDocumentExpiry", () => {
  it("flags an FD maturity within the 90-day window and an overdue insurance renewal", () => {
    const wealthEntries = [{ id: "fd1", categoryId: "fd", name: "FD1", maturityDate: "2025-02-15" }];
    const commitments = [{ id: "c1", category: "Insurance", name: "LIC", endDate: "2024-12-01" }];
    const result = scanDocumentExpiry(wealthEntries, commitments, "2025-01-01");
    expect(result.upcoming.length).toBe(1);
    expect(result.upcoming[0].kind).toBe("fd-maturity");
    expect(result.overdue.length).toBe(1);
    expect(result.urgency).toBe("urgent");
  });

  it("reports 'clear' urgency with nothing tracked or due", () => {
    expect(scanDocumentExpiry([], [], "2025-01-01").urgency).toBe("clear");
  });
});
