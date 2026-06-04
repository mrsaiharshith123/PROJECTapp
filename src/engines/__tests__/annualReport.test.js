import { describe, expect, it } from "vitest";
import { buildAnnualReportData } from "../annualReport.js";

describe("buildAnnualReportData", () => {
  it("returns report year and pressure score 0–100", () => {
    const data = buildAnnualReportData({
      commitments: [{ id: 1, name: "Rent", amount: 10000, remainingAmount: 10000, status: "pending", repeatType: "monthly" }],
      lendings: [],
      settings: { displayName: "Test", monthlyIncome: 50000, userMode: "salaried" },
      monthlySnapshots: [],
      getEffectiveStatus: (c) => c.status,
      getEffectiveLendingStatus: () => "active",
      todayStr: "2026-06-04",
    });
    expect(data.reportYear).toMatch(/^FY /);
    expect(data.pressureScore).toBeGreaterThanOrEqual(0);
    expect(data.pressureScore).toBeLessThanOrEqual(100);
  });
});
