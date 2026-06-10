import { describe, expect, it } from "vitest";
import { buildCaSummarySnapshot, formatCaSummaryPlainText } from "../caExport.js";

describe("caExport", () => {
  it("builds structured snapshot", () => {
    const data = buildCaSummarySnapshot({
      commitments: [{ name: "Home EMI", category: "EMI", amount: 20000, remainingAmount: 500000 }],
      lendings: [],
      goals: [],
      settings: { monthlyIncome: 100000, displayName: "Test" },
      getEffectiveStatus: () => "pending",
      todayStr: "2026-06-10",
    });
    expect(data.cashflow.monthlyIncome).toBe(100000);
    expect(data.emis.length).toBe(1);
    const text = formatCaSummaryPlainText(data);
    expect(text).toContain("Home EMI");
  });
});
