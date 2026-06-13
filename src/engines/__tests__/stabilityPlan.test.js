import { describe, it, expect } from "vitest";
import { buildShareableStabilitySummary, buildStabilityAheadPlan } from "../stabilityPlan.js";

describe("buildShareableStabilitySummary", () => {
  it("labels take-home income by default", () => {
    const s = buildShareableStabilitySummary({
      mode: "salaried",
      cash: { monthlyBurden: 20000, freeMoney: 50000 },
      income: 80000,
      forecastMonths: [],
      heavyMonths: [],
      incomeEntryBasis: "take_home",
    });
    expect(s).toContain("take-home");
    expect(s).not.toContain("Gross income vs bills");
  });

  it("adds gross disclaimer when requested", () => {
    const s = buildShareableStabilitySummary({
      mode: "family",
      cash: { monthlyBurden: 20000, freeMoney: 5000 },
      income: 100000,
      forecastMonths: [],
      heavyMonths: [],
      incomeEntryBasis: "gross",
    });
    expect(s).toContain("gross");
    expect(s).toContain("Gross income vs bills");
  });
});

describe("buildStabilityAheadPlan", () => {
  it("returns forecast rows for empty commitments", () => {
    const r = buildStabilityAheadPlan({
      commitments: [],
      lendings: [],
      goals: [],
      settings: { monthlyIncome: 60000, secondaryMonthlyIncome: 0, incomeEntryBasis: "take_home" },
      getEffectiveStatus: () => "pending",
      getEffectiveLendingStatus: () => "complete",
      todayStr: "2026-05-01",
      mode: "salaried",
    });
    expect(r.forecastMonths.length).toBeGreaterThan(0);
    expect(r.shareSummary).toContain("Perovo");
  });
});
