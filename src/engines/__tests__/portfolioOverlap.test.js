import { describe, it, expect } from "vitest";
import { detectPortfolioOverlap } from "../mutualFundIntel.js";

describe("detectPortfolioOverlap", () => {
  it("flags 3+ funds in the same sub-type as overlapping", () => {
    const entries = [
      { id: "f1", kind: "asset", categoryId: "mutual_fund", name: "Fund A", value: 100000, fundSubType: "large_cap" },
      { id: "f2", kind: "asset", categoryId: "mutual_fund", name: "Fund B", value: 150000, fundSubType: "large_cap" },
      { id: "f3", kind: "asset", categoryId: "mutual_fund", name: "Fund C", value: 50000, fundSubType: "large_cap" },
      { id: "f4", kind: "asset", categoryId: "mutual_fund", name: "Fund D", value: 100000, fundSubType: "debt" },
    ];
    const result = detectPortfolioOverlap(entries);
    expect(result.overlapping.length).toBe(1);
    expect(result.overlapping[0].subType).toBe("large_cap");
    expect(result.overlapping[0].funds.length).toBe(3);
    expect(result.hasOverlap).toBe(true);
  });

  it("does not flag genuinely diversified sub-type spread", () => {
    const entries = [
      { id: "f1", kind: "asset", categoryId: "mutual_fund", name: "Fund A", value: 100000, fundSubType: "large_cap" },
      { id: "f2", kind: "asset", categoryId: "mutual_fund", name: "Fund B", value: 100000, fundSubType: "debt" },
      { id: "f3", kind: "asset", categoryId: "mutual_fund", name: "Fund C", value: 100000, fundSubType: "small_cap" },
    ];
    const result = detectPortfolioOverlap(entries);
    expect(result.hasOverlap).toBe(false);
  });

  it("ignores non-mutual-fund and hidden entries", () => {
    const entries = [
      { id: "s1", kind: "asset", categoryId: "stocks", name: "Stock", value: 100000 },
      { id: "f1", kind: "asset", categoryId: "mutual_fund", hidden: true, name: "Hidden", value: 100000, fundSubType: "large_cap" },
    ];
    const result = detectPortfolioOverlap(entries);
    expect(result.totalFunds).toBe(0);
  });
});
