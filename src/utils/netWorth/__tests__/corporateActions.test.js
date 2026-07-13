import { describe, it, expect } from "vitest";
import { parseSplitMultiplier, applyStockSplitOrBonus } from "../corporateActions.js";

describe("parseSplitMultiplier", () => {
  it("parses a 2:1 split as a doubling multiplier", () => {
    expect(parseSplitMultiplier("2:1")).toBe(2);
  });

  it("parses a 1:5 reverse split as a fifth", () => {
    expect(parseSplitMultiplier("1:5")).toBe(0.2);
  });

  it("parses a 5:1 split (INFY-style, 5 new for 1 old) as a 5x multiplier", () => {
    expect(parseSplitMultiplier("5:1")).toBe(5);
  });

  it("accepts dash and slash separators", () => {
    expect(parseSplitMultiplier("3-1")).toBe(3);
    expect(parseSplitMultiplier("3/1")).toBe(3);
  });

  it("returns null for garbage or non-positive input", () => {
    expect(parseSplitMultiplier("")).toBeNull();
    expect(parseSplitMultiplier("₹5/share")).toBeNull();
    expect(parseSplitMultiplier("0:1")).toBeNull();
    expect(parseSplitMultiplier("1:0")).toBeNull();
  });
});

describe("applyStockSplitOrBonus", () => {
  it("doubles quantity and halves average buy price on a 2:1 split", () => {
    const result = applyStockSplitOrBonus({ quantity: 100, buyPrice: 200, ratio: "2:1" });
    expect(result).toEqual({ quantity: 200, buyPrice: 100 });
  });

  it("keeps total cost basis constant across the fold", () => {
    const before = { quantity: 50, buyPrice: 340 };
    const result = applyStockSplitOrBonus({ ...before, ratio: "1:1" });
    expect(result.quantity * result.buyPrice).toBeCloseTo(before.quantity * before.buyPrice, 5);
  });

  it("handles a 5:1 split growing quantity 5x and shrinking average price to a fifth", () => {
    const result = applyStockSplitOrBonus({ quantity: 10, buyPrice: 1500, ratio: "5:1" });
    expect(result).toEqual({ quantity: 50, buyPrice: 300 });
  });

  it("returns null when ratio is unparseable", () => {
    expect(applyStockSplitOrBonus({ quantity: 10, buyPrice: 100, ratio: "not a ratio" })).toBeNull();
  });

  it("returns null when there's no existing holding to fold into", () => {
    expect(applyStockSplitOrBonus({ quantity: 0, buyPrice: 100, ratio: "2:1" })).toBeNull();
    expect(applyStockSplitOrBonus({ quantity: 10, buyPrice: 0, ratio: "2:1" })).toBeNull();
  });
});
