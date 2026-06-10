import { describe, expect, it } from "vitest";
import { detectRecurringFromDailySpends } from "../recurringSpendDetect.js";

describe("detectRecurringFromDailySpends", () => {
  it("groups frequent merchant logs", () => {
    const spends = ["2026-06-01", "2026-06-08", "2026-06-15", "2026-06-22"].map((date) => ({
      date,
      merchant: "Swiggy",
      amount: 400,
    }));
    const rows = detectRecurringFromDailySpends(spends, { monthKey: "2026-06", minOccurrences: 3 });
    expect(rows.length).toBe(1);
    expect(rows[0].occurrences).toBeGreaterThanOrEqual(3);
    expect(rows[0].suggestedAmount).toBe(400);
  });
});
