import { describe, expect, it } from "vitest";
import {
  buildMonthCumulativeSpendSeries,
  extendSpendSeriesToMonthEnd,
} from "../monthSpendSeries.js";

describe("monthSpendSeries", () => {
  it("builds cumulative spend from bill payments and daily spends", () => {
    const commitments = [
      {
        payments: [{ date: "2026-06-05", amount: 5000 }],
      },
    ];
    const dailySpends = [{ date: "2026-06-08", amount: 4000, profileId: "default" }];
    const series = buildMonthCumulativeSpendSeries(
      commitments,
      dailySpends,
      "2026-06-08",
      "default",
    );
    expect(series.length).toBe(8);
    expect(series[0].label).toBe("1 Jun");
    expect(series[series.length - 1].label).toMatch(/8 Jun/);
    expect(series[series.length - 1].value).toBe(9000);
  });

  it("extends series toward month end for sparkline", () => {
    const base = [
      { day: 1, value: 0 },
      { day: 8, value: 9000 },
    ];
    const extended = extendSpendSeriesToMonthEnd(base, 150000, "2026-06-08");
    expect(extended.length).toBeGreaterThan(base.length);
    expect(extended[extended.length - 1].day).toBe(30);
  });
});
