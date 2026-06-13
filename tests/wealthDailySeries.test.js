import { describe, it, expect } from "vitest";
import { buildWealthDailySeries, buildWealthDailySeriesFromEntries } from "../src/utils/wealthDailySeries.js";

describe("buildWealthDailySeries", () => {
  it("starts from account creation date at zero", () => {
    const created = new Date("2026-06-01T10:00:00").getTime();
    const series = buildWealthDailySeries([], [], "default", 100000, 20000, created);
    expect(series[0]).toEqual({
      day: "2026-06-01",
      label: "1 Jun 2026",
      assets: 0,
      liabilities: 0,
    });
    expect(series[series.length - 1].assets).toBe(100000);
    expect(series[series.length - 1].liabilities).toBe(20000);
  });

  it("replays entry updates per day", () => {
    const entries = [
      {
        id: "1",
        kind: "asset",
        categoryId: "bank",
        name: "Bank",
        value: 50000,
        profileId: "default",
        createdAt: new Date("2026-06-10T10:00:00").getTime(),
        updatedAt: new Date("2026-06-10T10:00:00").getTime(),
      },
      {
        id: "2",
        kind: "liability",
        categoryId: "loan",
        name: "Loan",
        value: 20000,
        profileId: "default",
        createdAt: new Date("2026-06-12T10:00:00").getTime(),
        updatedAt: new Date("2026-06-12T10:00:00").getTime(),
      },
    ];
    const fromEntries = buildWealthDailySeriesFromEntries(entries, "default");
    expect(fromEntries).toHaveLength(2);
    expect(fromEntries[0].assets).toBe(50000);
    expect(fromEntries[1].liabilities).toBe(20000);

    const created = new Date("2026-06-01T10:00:00").getTime();
    const chart = buildWealthDailySeries([], entries, "default", 50000, 20000, created);
    expect(chart[0].assets).toBe(0);
    expect(chart[chart.length - 1].assets).toBe(50000);
    expect(chart[chart.length - 1].liabilities).toBe(20000);
  });
});
