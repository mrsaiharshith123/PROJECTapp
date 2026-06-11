import { describe, expect, it } from "vitest";
import { computeLiquidityIntelligence } from "../liquidity.js";

describe("computeLiquidityIntelligence", () => {
  it("returns emergency liquidity strength band", () => {
    const r = computeLiquidityIntelligence({
      entries: [
        { id: "a1", type: "asset", categoryId: "bank", value: 200000, label: "Bank" },
        { id: "l1", type: "liability", categoryId: "credit_card", value: 50000, label: "Card" },
      ],
      monthlyObligations: 30000,
      monthlyIncome: 80000,
    });
    expect(r.emergencyLiquidityStrength).toMatch(/strong|moderate|weak|critical/);
    expect(r.flexibilityScore).toBeGreaterThanOrEqual(0);
    expect(r.insightKeys.length).toBeGreaterThanOrEqual(0);
  });
});
