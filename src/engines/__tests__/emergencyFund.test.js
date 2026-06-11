import { describe, expect, it } from "vitest";
import { computeEmergencyFundIntel } from "../emergencyFund.js";

describe("computeEmergencyFundIntel", () => {
  it("recommends higher reserve when pressure is high", () => {
    const high = computeEmergencyFundIntel({ monthlyBurden: 50000, liquidSavings: 10000, pressureScore: 75 });
    const low = computeEmergencyFundIntel({ monthlyBurden: 50000, liquidSavings: 10000, pressureScore: 40 });
    expect(high.recommended).toBeGreaterThan(low.recommended);
    expect(high.messageKey).toMatch(/^emergency\.tier\./);
  });

  it("computes months of cover and monthly top-up plan", () => {
    const r = computeEmergencyFundIntel({
      monthlyBurden: 40000,
      liquidSavings: 80000,
      pressureScore: 55,
      dependents: 2,
    });
    expect(r.monthsOfCover).toBe(2);
    expect(r.suggestedMonthlyTopUp).toBeGreaterThan(0);
    expect(r.insightKeys.some((i) => i.key.startsWith("emergency.insight."))).toBe(true);
  });

  it("marks funded reserve when gap is zero", () => {
    const r = computeEmergencyFundIntel({
      monthlyBurden: 20000,
      liquidSavings: 200000,
      pressureScore: 45,
    });
    expect(r.gap).toBe(0);
    expect(r.tier).toBe("on_track");
  });
});
