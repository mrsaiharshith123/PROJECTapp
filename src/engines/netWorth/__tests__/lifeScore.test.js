import { describe, expect, it } from "vitest";
import { computeFinancialLifeScore } from "../lifeScore.js";
import { computeDebtHealth } from "../debtHealth.js";
import { computeLiquidityIntelligence } from "../liquidity.js";

describe("computeFinancialLifeScore", () => {
  it("returns bounded score and label key", () => {
    const debtHealth = computeDebtHealth({ liabilityEntries: [], monthlyIncome: 80000 });
    const liquidity = computeLiquidityIntelligence({
      entries: [{ id: "a1", type: "asset", categoryId: "cash", value: 100000, label: "Cash" }],
      monthlyObligations: 20000,
      monthlyIncome: 80000,
    });
    const r = computeFinancialLifeScore({ liquidity, debtHealth, monthlySavingsRate: 20, savingsStreakMonths: 3 });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.labelKey).toBeTruthy();
  });
});
