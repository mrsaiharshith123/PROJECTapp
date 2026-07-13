import { describe, it, expect } from "vitest";
import { computeAssetLiabilityMatch } from "../assetLiabilityMatch.js";

describe("computeAssetLiabilityMatch", () => {
  it("marks a home loan backed when a matching property asset exists", () => {
    const assets = [{ id: "p1", categoryId: "property_residential", name: "Flat", value: 8000000 }];
    const liabilities = [{ id: "l1", categoryId: "home_loan", name: "Home loan", value: 4000000 }];
    const result = computeAssetLiabilityMatch(assets, liabilities);
    const row = result.rows.find((r) => r.id === "l1");
    expect(row.backed).toBe(true);
    expect(row.matchedAssetValue).toBe(8000000);
    expect(row.coverageRatio).toBe(2);
    expect(result.backedDebt).toBe(4000000);
    expect(result.unbackedDebt).toBe(0);
  });

  it("marks a personal loan as always unbacked — no backing asset category exists for it", () => {
    const liabilities = [{ id: "l1", categoryId: "personal_loan", name: "Personal loan", value: 300000 }];
    const result = computeAssetLiabilityMatch([], liabilities);
    expect(result.rows[0].backed).toBe(false);
    expect(result.unbackedDebt).toBe(300000);
    expect(result.payoffPriorityIds).toEqual(["l1"]);
  });

  it("marks a home loan unbacked when no property asset is recorded (backable category, but no match)", () => {
    const liabilities = [{ id: "l1", categoryId: "home_loan", name: "Home loan", value: 4000000 }];
    const result = computeAssetLiabilityMatch([], liabilities);
    expect(result.rows[0].backed).toBe(false);
    expect(result.unbackedDebt).toBe(4000000);
  });

  it("computes backedDebtPct correctly across a mix", () => {
    const assets = [{ id: "p1", categoryId: "property_residential", name: "Flat", value: 8000000 }];
    const liabilities = [
      { id: "l1", categoryId: "home_loan", name: "Home loan", value: 4000000 },
      { id: "l2", categoryId: "personal_loan", name: "Personal loan", value: 1000000 },
    ];
    const result = computeAssetLiabilityMatch(assets, liabilities);
    expect(result.totalDebt).toBe(5000000);
    expect(result.backedDebtPct).toBe(80);
  });
});
