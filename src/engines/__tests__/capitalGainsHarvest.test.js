import { describe, it, expect } from "vitest";
import { scanCapitalGainsHarvest } from "../capitalGainsHarvest.js";

describe("scanCapitalGainsHarvest", () => {
  it("finds an offsetting gain/loss pair and estimates tax saved", () => {
    const entries = [
      {
        id: "s1",
        kind: "asset",
        categoryId: "stocks",
        name: "Stock X",
        value: 145000,
        quantity: 100,
        buyPrice: 1000,
        lastLivePrice: 1450,
        purchaseYear: new Date().getFullYear() - 2,
      },
      {
        id: "m1",
        kind: "asset",
        categoryId: "mutual_fund",
        name: "Fund Y",
        value: 88000,
        purchasePrice: 100000,
        purchaseYear: new Date().getFullYear() - 2,
        fundSubType: "equity",
      },
    ];
    const result = scanCapitalGainsHarvest(entries);
    expect(result.gainers.length).toBe(1);
    expect(result.losers.length).toBe(1);
    expect(result.gainers[0].id).toBe("s1");
    expect(result.losers[0].id).toBe("m1");
    expect(result.hasOpportunity).toBe(true);
    expect(result.estimatedTaxSaved).toBeGreaterThan(0);
  });

  it("reports no opportunity when everything is a gain (nothing to offset)", () => {
    const entries = [
      { id: "s1", kind: "asset", categoryId: "stocks", name: "Stock X", value: 200000, quantity: 100, buyPrice: 1000, lastLivePrice: 2000 },
    ];
    const result = scanCapitalGainsHarvest(entries);
    expect(result.hasOpportunity).toBe(false);
    expect(result.losers.length).toBe(0);
  });

  it("ignores non-stock/MF categories and hidden entries", () => {
    const entries = [
      { id: "b1", kind: "asset", categoryId: "bank", name: "Savings", value: 100000 },
      { id: "s1", kind: "asset", categoryId: "stocks", hidden: true, name: "Hidden", value: 200000, quantity: 10, buyPrice: 1000, lastLivePrice: 2000 },
    ];
    const result = scanCapitalGainsHarvest(entries);
    expect(result.gainers.length).toBe(0);
    expect(result.losers.length).toBe(0);
  });
});
