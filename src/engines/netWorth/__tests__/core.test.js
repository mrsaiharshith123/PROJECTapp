import { describe, it, expect } from "vitest";
import { computeNetWorthCore, computeGrowthRates } from "../core.js";

describe("netWorth core", () => {
  it("computes net worth and liquid position", () => {
    const entries = [
      { id: "1", kind: "asset", categoryId: "bank", name: "HDFC", value: 200000, hidden: false },
      { id: "2", kind: "asset", categoryId: "property", name: "Flat", value: 5000000, hidden: false },
      { id: "3", kind: "liability", categoryId: "home_loan", name: "Loan", value: 3000000, hidden: false },
    ];
    const core = computeNetWorthCore(entries);
    expect(core.totalAssets).toBe(5200000);
    expect(core.totalLiabilities).toBe(3000000);
    expect(core.netWorth).toBe(2200000);
    expect(core.liquidNetWorth).toBeLessThan(core.netWorth);
  });

  it("computes growth rates from snapshots", () => {
    const growth = computeGrowthRates(
      [
        { month: "2026-04", netWorth: 100000 },
        { month: "2026-05", netWorth: 110000 },
      ],
      110000
    );
    expect(growth.monthlyPct).toBeCloseTo(10, 0);
    expect(growth.trend).toHaveLength(2);
  });
});
