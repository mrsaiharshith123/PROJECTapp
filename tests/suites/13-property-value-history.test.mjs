import { describe, it, expect } from "vitest";
import {
  expandMilestonesToSeries,
  sanitizeMilestoneRates,
  buildHistoryExpandOpts,
} from "../../src/utils/netWorth/propertyValueHistory.js";

/** Shared locality curve — two adjacent plots should get same ₹/sqyd at 2020. */
const localityMilestones = [
  { year: 1980, ratePerSqyd: 800 },
  { year: 1990, ratePerSqyd: 1500 },
  { year: 2000, ratePerSqyd: 4000 },
  { year: 2008, ratePerSqyd: 12000 },
  { year: 2020, ratePerSqyd: 35000 },
  { year: 2026, ratePerSqyd: 42000 },
];

describe("property value history", () => {
  it("same locality milestones scale by area at 2020", () => {
    const opts253 = {
      purchaseRatePerUnit: 500,
      currentRate: 42000,
      areaUnit: "sqyd",
    };
    const opts215 = { ...opts253 };

    const series253 = expandMilestonesToSeries(
      localityMilestones,
      253,
      1989,
      2026,
      0,
      opts253,
    );
    const series215 = expandMilestonesToSeries(
      localityMilestones,
      215,
      1986,
      2026,
      0,
      opts215,
    );

    const p2020_253 = series253.find((p) => p.year === 2020);
    const p2020_215 = series215.find((p) => p.year === 2020);
    expect(p2020_253).toBeTruthy();
    expect(p2020_215).toBeTruthy();

    const rateRatio = p2020_253.ratePerSqyd / p2020_215.ratePerSqyd;
    expect(rateRatio).toBeCloseTo(1, 1);

    const valueRatio = p2020_253.value / p2020_215.value;
    expect(valueRatio).toBeCloseTo(253 / 215, 1);
  });

  it("sanitizes total value mistaken as ratePerSqyd", () => {
    const bad = [{ year: 2020, ratePerSqyd: 3_289_000 }];
    const fixed = sanitizeMilestoneRates(bad, 215, "sqyd");
    expect(fixed[0].ratePerSqyd).toBeCloseTo(15298, -2);
  });

  it("buildHistoryExpandOpts prefers market rate over current value", () => {
    const opts = buildHistoryExpandOpts(
      { areaMeasure: 215, value: 12_650_000, marketRatePerSqyd: 42_000 },
      null,
    );
    expect(opts.currentRate).toBe(42_000);
  });
});
