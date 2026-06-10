import { describe, expect, it } from "vitest";
import { computeLiquidityIntelligence } from "../liquidity.js";
import { computeDebtHealth } from "../debtHealth.js";
import { computeFinancialLifeScore } from "../lifeScore.js";
import { computePressureVsWealth } from "../pressureWealth.js";
import { computeCashFlowIntel } from "../cashFlow.js";
import { buildNetWorthInsights } from "../insights.js";
import { detectNewMilestones } from "../milestones.js";
import { runWealthSimulation, PRESET_SCENARIOS } from "../simulation.js";

const pending = () => "pending";

describe("netWorth intel modules", () => {
  const entries = [
    { id: "a1", type: "asset", categoryId: "bank", value: 200000, label: "Bank" },
    { id: "l1", type: "liability", categoryId: "credit_card", value: 50000, label: "Card" },
  ];

  it("computeLiquidityIntelligence returns strength band", () => {
    const r = computeLiquidityIntelligence({
      entries,
      monthlyObligations: 30000,
      monthlyIncome: 80000,
    });
    expect(r.emergencyLiquidityStrength).toBeTruthy();
  });

  it("computeDebtHealth returns score", () => {
    const r = computeDebtHealth({
      liabilityEntries: entries.filter((e) => e.type === "liability"),
      commitments: [],
      monthlyIncome: 80000,
      getEffectiveStatus: pending,
    });
    expect(r.totalDebt).toBe(50000);
  });

  it("computeFinancialLifeScore returns label key", () => {
    const debtHealth = computeDebtHealth({
      liabilityEntries: [],
      monthlyIncome: 80000,
    });
    const liquidity = computeLiquidityIntelligence({
      entries: [{ id: "a1", type: "asset", categoryId: "cash", value: 100000, label: "Cash" }],
      monthlyObligations: 20000,
      monthlyIncome: 80000,
    });
    const r = computeFinancialLifeScore({ liquidity, debtHealth, monthlySavingsRate: 20 });
    expect(r.labelKey).toBeTruthy();
  });

  it("computePressureVsWealth returns posture", () => {
    const r = computePressureVsWealth({
      netWorth: 150000,
      liquidNetWorth: 100000,
      monthlyObligations: 30000,
      monthlyIncome: 80000,
      totalDebt: 50000,
      flexibilityScore: 55,
    });
    expect(r.posture).toBeTruthy();
  });

  it("computeCashFlowIntel summarizes obligations", () => {
    const r = computeCashFlowIntel({
      monthlyIncome: 80000,
      commitments: [{ amount: 20000, repeatType: "monthly", remainingAmount: 0 }],
      getEffectiveStatus: pending,
    });
    expect(r.monthlyObligations).toBeGreaterThan(0);
  });

  it("buildNetWorthInsights returns keyed insights", () => {
    const rows = buildNetWorthInsights({ savingsStreakMonths: 4, monthlyGrowthPct: 3 });
    expect(rows.some((i) => i.key)).toBe(true);
  });

  it("detectNewMilestones flags 1L net worth", () => {
    const r = detectNewMilestones({ netWorth: 110000, totalDebt: 0, liquidNetWorth: 80000, savingsStreakMonths: 0 }, []);
    expect(r.some((m) => m.id === "nw-1l")).toBe(true);
  });

  it("runWealthSimulation projects scenario outcome", () => {
    const scenario = PRESET_SCENARIOS.find((s) => s.id === "salary_raise");
    const r = runWealthSimulation(
      { netWorth: 100000, liquidNetWorth: 50000, monthlyIncome: 80000, monthlyObligations: 30000, totalDebt: 20000, investableAssets: 10000 },
      scenario,
    );
    expect(r.deltaNetWorth).toBeGreaterThan(0);
  });
});
