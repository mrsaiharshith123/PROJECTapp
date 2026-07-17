import { describe, it, expect } from "vitest";
import { computeCanonicalPressureScore } from "../pressureScore.js";
import { computeSurvivalAnalysis } from "../survival.js";
import { computeSafeToSpendDaily } from "../safeToSpend.js";
import { evaluateAffordability } from "../affordability.js";
import { totalMonthlyBurden } from "../burden.js";
import { buildCashflowForecastSeries } from "../forecastSeries.js";
import { forecastInsights } from "../forecast.js";
import { computeEmergencyFundIntel } from "../emergencyFund.js";
import { computeFinancialHealthScore } from "../financialHealth.js";
import { benchmarkNetWorth } from "../netWorthBenchmark.js";
import { estimateIncomeTax } from "../incomeTaxEstimate.js";
import { computePerovoScore } from "../perovoScore.js";

const status = () => "pending";

describe("critical financial engines smoke", () => {
  it("pressureScore returns finite number", () => {
    const score = computeCanonicalPressureScore({ commitments: [], income: 50000, getEffectiveStatus: status });
    expect(Number.isFinite(score)).toBe(true);
  });

  it("survival analysis returns tier", () => {
    const out = computeSurvivalAnalysis({
      income: 50000,
      freeMoney: 10000,
      liquidSavings: 50000,
      monthlyBurden: 20000,
    });
    expect(out.tier).toBeTruthy();
  });

  it("safeToSpend returns object", () => {
    expect(computeSafeToSpendDaily({ income: 50000, monthlyBurden: 20000, dayOfMonth: 15 })).toBeTruthy();
  });

  it("affordability returns verdict", () => {
    expect(evaluateAffordability(50000, 20000, 5000)).toBeTruthy();
  });

  it("burden sums commitments", () => {
    expect(totalMonthlyBurden([], status)).toBe(0);
  });

  it("forecast insights returns array", () => {
    expect(Array.isArray(forecastInsights([], "2026-01-15"))).toBe(true);
  });

  it("forecast series is array", () => {
    expect(
      Array.isArray(buildCashflowForecastSeries([], 50000, status, "2026-01-15")),
    ).toBe(true);
  });

  it("emergency fund intel returns object", () => {
    expect(computeEmergencyFundIntel({ monthlyBurden: 20000, liquidSavings: 50000 })).toBeTruthy();
  });

  it("financial health score is finite", () => {
    const r = computeFinancialHealthScore({
      commitments: [],
      lendings: [],
      income: 50000,
      getEffectiveStatus: status,
      openRemaining: 0,
      freeMoneyAfterBurden: 30000,
    });
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it("net worth benchmark returns object", () => {
    expect(benchmarkNetWorth({ netWorth: 100000, age: 30 })).toBeTruthy();
  });

  it("income tax estimate returns object", () => {
    expect(estimateIncomeTax({ annualGrossIncome: 1200000, regime: "new" })).toBeTruthy();
  });

  it("perovo score is finite", () => {
    expect(Number.isFinite(computePerovoScore({ pressureScore: 40 }).score)).toBe(true);
  });
});
