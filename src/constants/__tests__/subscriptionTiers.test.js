import { describe, expect, it } from "vitest";
import {
  effectiveAnnualMonthlyInr,
  PLAN_PRESENTATION,
  yearlyInrAfterSave,
  YEARLY_SAVE_PERCENT,
} from "../subscriptionTiers.js";

describe("subscriptionTiers pricing", () => {
  it("computes yearly price at 29% off monthly × 12", () => {
    expect(YEARLY_SAVE_PERCENT).toBe(29);
    expect(yearlyInrAfterSave(99)).toBe(843);
    expect(yearlyInrAfterSave(199)).toBe(1695);
  });

  it("PLAN_PRESENTATION annual prices match yearly save formula", () => {
    const pro = PLAN_PRESENTATION.find((p) => p.tier === "pro");
    const power = PLAN_PRESENTATION.find((p) => p.tier === "power");
    expect(pro?.annualInr).toBe(843);
    expect(power?.annualInr).toBe(1695);
    expect(effectiveAnnualMonthlyInr(pro?.annualInr)).toBe(70);
    expect(effectiveAnnualMonthlyInr(power?.annualInr)).toBe(141);
  });
});
