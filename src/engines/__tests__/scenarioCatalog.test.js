import { describe, expect, it } from "vitest";
import { buildUnifiedScenarioTiles, getApplicableWealthScenarios } from "../scenarioCatalog.js";

describe("scenarioCatalog", () => {
  it("hides debt scenarios when user has no debt", () => {
    const base = { monthlyIncome: 150000, monthlyObligations: 0, totalDebt: 0, liquidNetWorth: 100000 };
    const wealth = getApplicableWealthScenarios(base);
    expect(wealth.some((s) => s.id === "debt_paydown")).toBe(false);
    expect(wealth.some((s) => s.id === "salary_raise")).toBe(true);
  });

  it("shows debt paydown only when debt exists", () => {
    const base = { monthlyIncome: 80000, monthlyObligations: 20000, totalDebt: 500000, liquidNetWorth: 50000 };
    const wealth = getApplicableWealthScenarios(base);
    expect(wealth.some((s) => s.id === "debt_paydown")).toBe(true);
    expect(wealth.some((s) => s.id === "cut_expenses")).toBe(true);
  });

  it("builds unified tiles without duplicate layoff/side income", () => {
    const tiles = buildUnifiedScenarioTiles({
      pack: { rows: [{ id: "job_loss", label: "Job loss", headline: "Safe", detail: "x" }] },
      simulationBase: { monthlyIncome: 100000, totalDebt: 0, monthlyObligations: 0, liquidNetWorth: 0 },
      t: (k) => k,
    });
    const labels = tiles.map((t) => t.id);
    expect(labels).toContain("cf-job_loss");
    expect(labels).not.toContain("nw-layoff");
    expect(labels).not.toContain("nw-side_income");
    expect(labels).not.toContain("nw-child_expense");
  });
});
