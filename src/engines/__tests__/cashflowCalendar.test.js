import { describe, expect, it } from "vitest";
import { buildCashflowCalendar } from "../cashflowCalendar.js";

const pending = () => "pending";

describe("buildCashflowCalendar", () => {
  it("returns day rows for salary credit day", () => {
    const r = buildCashflowCalendar({
      commitments: [],
      getEffectiveStatus: pending,
      todayStr: "2026-06-05",
      salaryCreditDay: 5,
      income: 80000,
      daysAhead: 7,
    });
    expect(r.days.length).toBe(7);
    expect(r.days.some((d) => d.pressure === "salary")).toBe(true);
  });
});
