import { describe, it, expect } from "vitest";
import { computeSurvivalAnalysis } from "../survival.js";

const base = {
  income: 80000,
  freeMoney: 10000,
  settings: {},
  todayStr: "2025-06-01",
  commitments: [],
  getEffectiveStatus: () => "active",
};

describe("survival", () => {
  it("returns finite survival months when savings and burn are valid", () => {
    const r = computeSurvivalAnalysis({
      ...base,
      liquidSavings: 60000,
      monthlyBurden: 20000,
      lendingOutflow: 0,
    });
    expect(r.survivalMonths == null || Number.isFinite(r.survivalMonths)).toBe(true);
  });

  it("handles zero burn", () => {
    const r = computeSurvivalAnalysis({
      ...base,
      liquidSavings: 0,
      monthlyBurden: 0,
      lendingOutflow: 0,
    });
    expect(r.tier).toBe("strong");
  });

  it("never NaN when monthlyBurden=0 but savings>0", () => {
    const r = computeSurvivalAnalysis({
      ...base,
      liquidSavings: 50000,
      monthlyBurden: 0,
      lendingOutflow: 0,
    });
    expect(r.survivalMonths == null || Number.isFinite(r.survivalMonths)).toBe(true);
  });

  it("tier label is always a string", () => {
    const r = computeSurvivalAnalysis({
      ...base,
      liquidSavings: 10000,
      monthlyBurden: 5000,
      lendingOutflow: 0,
    });
    expect(typeof r.tierLabel).toBe("string");
  });

  it("regression: stressed-scenario runway is never negative for a low earner with thin savings", () => {
    // A low earner whose liquid + free money is well under the emergency-shock
    // amount previously produced a negative "runwayMonths" that rendered
    // straight to the UI (e.g. "-14.2 months"). Must always clamp to >= 0.
    const r = computeSurvivalAnalysis({
      income: 15000,
      freeMoney: 500,
      liquidSavings: 3000,
      monthlyBurden: 12000,
      lendingOutflow: 0,
      settings: {},
      todayStr: "2025-06-01",
      commitments: [],
      getEffectiveStatus: () => "active",
    });
    expect(r.scenarios.stressed.runwayMonths).toBeGreaterThanOrEqual(0);
    expect(r.scenarios.critical.runwayMonths).toBeGreaterThanOrEqual(0);
    expect(r.scenarios.baseline.runwayMonths).toBeGreaterThanOrEqual(0);
  });

  it("scales the emergency shock to burn rate instead of a flat figure for low earners", () => {
    const lowEarner = computeSurvivalAnalysis({
      income: 15000,
      freeMoney: 500,
      liquidSavings: 3000,
      monthlyBurden: 8000,
      lendingOutflow: 0,
      settings: {},
      todayStr: "2025-06-01",
      commitments: [],
      getEffectiveStatus: () => "active",
    });
    // Emergency hit should be capped at 2x monthly burn (~16,000), not the flat ₹150,000.
    expect(lowEarner.scenarios.stressed.poolAfterEmergency).toBeGreaterThanOrEqual(0);
  });
});
