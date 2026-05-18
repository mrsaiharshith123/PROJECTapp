import { describe, it, expect } from "vitest";
import { buildIncomeSensitivityRows } from "../pressureScore.js";

describe("buildIncomeSensitivityRows", () => {
  it("reduces free money when income drops", () => {
    const commitments = [
      { id: "1", amount: 30000, remainingAmount: 30000, category: "Rent", dueDate: "2026-05-10" },
    ];
    const getEffectiveStatus = () => "pending";
    const rows = buildIncomeSensitivityRows(commitments, 100000, getEffectiveStatus, [0.1]);
    expect(rows).toHaveLength(1);
    expect(rows[0].cutPercent).toBe(10);
    expect(rows[0].hypotheticalIncome).toBe(90000);
    expect(rows[0].freeMoney).toBeLessThan(70000);
  });
});
