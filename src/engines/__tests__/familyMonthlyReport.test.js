import { describe, expect, it } from "vitest";
import { buildFamilyMonthlyReport } from "../familyMonthlyReport.js";

const status = () => "pending";

describe("buildFamilyMonthlyReport", () => {
  it("returns core report fields", () => {
    const report = buildFamilyMonthlyReport({
      settings: { monthlyIncome: 80000, dependents: 2, householdRoomName: "Sharma Family" },
      commitments: [{ id: 1, amount: 10000, category: "EMI", repeatType: "monthly" }],
      getEffectiveStatus: status,
      todayStr: "2026-06-10",
      monthlySnapshots: [
        { month: "2026-04", pressureScore: 50 },
        { month: "2026-05", pressureScore: 45 },
      ],
    });
    expect(report.income).toBe(80000);
    expect(report.familyName).toBe("Sharma Family");
    expect(report.stabilityTier).toBeTruthy();
    expect(report.pressureDirection).toBe("down");
  });
});
