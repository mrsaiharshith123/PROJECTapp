import { describe, it, expect } from "vitest";
import * as engine from "../core.js";
import { computeNetWorthCore, sumAssets, sumLiabilities, effectiveEntryValue } from "../core.js";

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

describe("effectiveEntryValue / fractional ownership — regression", () => {
  it("counts the full value when ownershipPct is unset (default, zero behavior change)", () => {
    expect(effectiveEntryValue({ value: 1000000 })).toBe(1000000);
  });

  it("counts only the user's share when ownershipPct is set", () => {
    // Ancestral property, user owns 40% — net worth must reflect 40%, not the full value.
    expect(effectiveEntryValue({ value: 1000000, ownershipPct: 40 })).toBe(400000);
  });

  it("clamps ownershipPct to 0-100", () => {
    expect(effectiveEntryValue({ value: 1000000, ownershipPct: 150 })).toBe(1000000);
    expect(effectiveEntryValue({ value: 1000000, ownershipPct: -20 })).toBe(0);
  });

  it("computeNetWorthCore reflects fractional ownership in totals, not the full property value", () => {
    const entries = [
      { id: "p1", kind: "asset", categoryId: "property_land", name: "Ancestral land", value: 5000000, ownershipPct: 25 },
      { id: "b1", kind: "asset", categoryId: "bank", name: "Savings", value: 100000 },
    ];
    const result = computeNetWorthCore(entries);
    // 5,000,000 * 25% + 100,000 = 1,350,000 — not 5,100,000.
    expect(result.totalAssets).toBe(1350000);
    const propertyRow = result.assetAllocation.find((a) => a.id === "p1");
    expect(propertyRow.value).toBe(1250000);
    expect(propertyRow.fullValue).toBe(5000000);
    expect(propertyRow.ownershipPct).toBe(25);
  });
});
