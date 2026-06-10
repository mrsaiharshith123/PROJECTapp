import { describe, expect, it } from "vitest";
import { buildPaycheckTimeline } from "../paycheckTimeline.js";

describe("buildPaycheckTimeline", () => {
  it("projects buffer after salary and bills", () => {
    const r = buildPaycheckTimeline({
      commitments: [
        { name: "Rent", amount: 15000, dueDate: "2026-06-05", repeatType: "monthly", startDate: "2026-01-05" },
      ],
      getEffectiveStatus: () => "pending",
      salaryCreditDay: 1,
      income: 80000,
      todayStr: "2026-06-01",
      daysAhead: 30,
    });
    expect(r.hasSalaryDay).toBe(true);
    expect(r.bufferAfterBills).toBeGreaterThanOrEqual(0);
  });
});
