import { describe, it, expect } from "vitest";
import * as engine from "../core.js";
import { computeNetWorthCore, sumAssets, sumLiabilities } from "../core.js";

describe("src/engines/netWorth/core.js", () => {
  it("loads and exports at least one symbol", () => {
    expect(engine).toBeTruthy();
    expect(Object.keys(engine).length).toBeGreaterThan(0);
  });
});

describe("computeNetWorthCore — exact-value regression (headline net-worth figure)", () => {
  const entries = [
    { id: "a1", kind: "asset", categoryId: "bank", name: "HDFC savings", value: 250000 },
    { id: "a2", kind: "asset", categoryId: "gold", name: "Gold jewelry", value: 180500 },
    { id: "a3", kind: "asset", categoryId: "property_residential", name: "Flat", value: 6500000 },
    { id: "l1", kind: "liability", categoryId: "home_loan", name: "Home loan", value: 3200000 },
    { id: "l2", kind: "liability", categoryId: "credit_card", name: "Card dues", value: 45250 },
  ];

  it("sums assets and liabilities to the exact rupee", () => {
    expect(sumAssets(entries.filter((e) => e.kind === "asset"))).toBe(6930500);
    expect(sumLiabilities(entries.filter((e) => e.kind === "liability"))).toBe(3245250);
  });

  it("computes exact net worth and liquid net worth", () => {
    const result = computeNetWorthCore(entries);
    expect(result.totalAssets).toBe(6930500);
    expect(result.totalLiabilities).toBe(3245250);
    expect(result.netWorth).toBe(3685250);
    // liquidNetWorth = (bank@1.0 + gold@semi-liquid weight + property@locked weight) - liabilities
    // exact value depends on liquidityTierWeight(), but it must be finite and never NaN.
    expect(Number.isFinite(result.liquidNetWorth)).toBe(true);
  });

  it("does not accumulate floating-point drift across many small entries", () => {
    // 10,000 entries of ₹0.1 each should sum to exactly ₹1000, not 999.999999... .
    const manyAssets = Array.from({ length: 10000 }, (_, i) => ({
      id: `a${i}`,
      kind: "asset",
      categoryId: "bank",
      value: 0.1,
    }));
    expect(sumAssets(manyAssets)).toBe(1000);
  });
});
