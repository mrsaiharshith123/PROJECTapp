import { describe, expect, it } from "vitest";
import { buildNetWorthInsights } from "../insights.js";

describe("buildNetWorthInsights", () => {
  it("returns i18n-keyed insight objects", () => {
    const rows = buildNetWorthInsights({
      savingsStreakMonths: 4,
      monthlyGrowthPct: 3,
      liabilitiesGrowingFaster: true,
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((i) => i.key && i.id)).toBe(true);
    expect(rows.every((i) => !i.text)).toBe(true);
  });
});
