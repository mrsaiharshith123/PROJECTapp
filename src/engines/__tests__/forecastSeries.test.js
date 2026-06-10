import { describe, it, expect } from "vitest";
import {
  buildCashflowForecastSeries,
  amountDueInMonth,
  MONEY_OUTLOOK_WINDOW,
} from "../forecastSeries.js";
import { getEffectiveStatus } from "../../utils/commitmentStatus.js";

describe("buildCashflowForecastSeries", () => {
  it("includes future one-time bills marked upnext today", () => {
    const commitments = [
      {
        id: "school",
        name: "School fee",
        amount: 50000,
        remainingAmount: 50000,
        repeatType: "none",
        dueDate: "2026-06-15",
        startDate: "2026-06-15",
        category: "School",
      },
    ];
    const rows = buildCashflowForecastSeries(commitments, 100000, getEffectiveStatus, "2026-05-01", 6);
    const june = rows.find((r) => r.monthKey === "2026-06");
    expect(june).toBeDefined();
    expect(june.due).toBe(50000);
  });

  it("returns seven months with three months of history when using outlook window", () => {
    const rows = buildCashflowForecastSeries([], 50000, getEffectiveStatus, "2026-06-15", MONEY_OUTLOOK_WINDOW.months, {
      startOffset: MONEY_OUTLOOK_WINDOW.startOffset,
    });
    expect(rows).toHaveLength(7);
    expect(rows.map((r) => r.monthKey)).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
  });

  it("clears current month after payment recorded in that month", () => {
    const commitments = [
      {
        id: "netflix",
        name: "Netflix",
        amount: 199,
        remainingAmount: 0,
        repeatType: "monthly",
        dueDate: "2026-05-10",
        startDate: "2025-09-10",
        payments: [{ amount: 199, date: "2026-05-12" }],
        status: "pending",
      },
    ];
    const monthKey = "2026-05";
    expect(amountDueInMonth(commitments[0], monthKey, "05", getEffectiveStatus, "2026-05-15")).toBe(0);
    const rows = buildCashflowForecastSeries(commitments, 50000, getEffectiveStatus, "2026-05-15", 3);
    const may = rows.find((r) => r.monthKey === monthKey);
    expect(may?.due).toBe(0);
  });
});
