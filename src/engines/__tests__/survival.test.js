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
});
