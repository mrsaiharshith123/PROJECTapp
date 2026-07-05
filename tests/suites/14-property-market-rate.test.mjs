import { describe, it, expect } from "vitest";
import {
  stabilizePropertyMarketRate,
  applyStabilizedMarketRate,
} from "../../src/utils/netWorth/propertyMarketRate.js";

describe("property market rate stabilization", () => {
  it("prefers range midpoint anchored to govt rate", () => {
    const md = {
      marketRate: { perSqyd: 120000, rangeMin: 80000, rangeMax: 100000 },
      governmentRate: { perSqyd: 35000 },
    };
    const rate = stabilizePropertyMarketRate(md);
    expect(rate).toBeGreaterThanOrEqual(80000);
    expect(rate).toBeLessThanOrEqual(110000);
  });

  it("rejects wild jump vs stored locality rate", () => {
    const md = {
      marketRate: { perSqyd: 15000, rangeMin: 14000, rangeMax: 16000 },
      governmentRate: { perSqyd: 5000 },
    };
    const rate = stabilizePropertyMarketRate(md, { localityRate: 42000 });
    expect(rate).toBe(42000);
  });

  it("applyStabilizedMarketRate recomputes implied value", () => {
    const md = { marketRate: { perSqyd: 99999 } };
    const out = applyStabilizedMarketRate(md, 42000, 253, 0);
    expect(out.impliedMarketValue).toBe(42000 * 253);
    expect(out.marketRate.perSqyd).toBe(42000);
  });
});
