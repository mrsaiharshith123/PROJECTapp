import { describe, expect, it } from "vitest";
import { buildLendingBreakdownChartData } from "../lendingDetailChartData.js";
import { buildLendingDashboard } from "../lendingFinancials.js";

const t = (k) => k;

describe("lendingDetailChartData", () => {
  it("builds repaid vs remaining", () => {
    const lending = {
      totalPayable: 100000,
      remainingAmount: 40000,
      payments: [{ amount: 60000, date: "2026-01-01" }],
    };
    const dash = buildLendingDashboard(lending, {});
    const rows = buildLendingBreakdownChartData(lending, dash, t);
    expect(rows.some((r) => r.value === 60000)).toBe(true);
    expect(rows.some((r) => r.value === 40000)).toBe(true);
  });
});
