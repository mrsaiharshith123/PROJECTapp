import { describe, it, expect } from "vitest";
import { buildCashflowForecastSeries } from "../forecastSeries.js";
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
});
