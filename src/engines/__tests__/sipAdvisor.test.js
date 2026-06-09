import { describe, it, expect } from "vitest";
import { sipFutureValue, analyzeSipPlan } from "../sipAdvisor.js";

describe("sipAdvisor", () => {
  it("computes future value", () => {
    expect(sipFutureValue(5000, 120, 0.12)).toBeGreaterThan(500_000);
  });

  it("flags unaffordable SIP vs free cash", () => {
    const plan = analyzeSipPlan({ monthlySip: 40_000, years: 5, monthlyFreeCash: 50_000 });
    expect(plan.affordable).toBe(false);
  });
});
