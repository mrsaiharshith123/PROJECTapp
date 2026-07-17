import { describe, it, expect } from "vitest";
import { buildQuarterlyNarrative, quarterBoundsForMonth, snapshotsInQuarter } from "../quarterlyNarrative.js";

describe("buildQuarterlyNarrative", () => {
  const snapshots = [
    { month: "2025-04", netWorth: 1000000, totalAssets: 1200000, totalLiabilities: 200000 },
    { month: "2025-06", netWorth: 1184000, totalAssets: 1400000, totalLiabilities: 216000 },
  ];
  const entries = [{ id: "p1", kind: "asset", categoryId: "property_residential", name: "Hanamkonda flat", value: 900000 }];

  it("reports the correct net-worth delta and names the largest holding as the driver", () => {
    const result = buildQuarterlyNarrative({ snapshots, entries, commitments: [] });
    expect(result.hasData).toBe(true);
    expect(result.netWorthDelta).toBe(184000);
    expect(result.direction).toBe("up");
    expect(result.beats[0].key).toBe("quarterlyNarrative.netWorthGrewWithDriver");
    expect(result.beats[0].params.driverName).toBe("Hanamkonda flat");
  });

  it("flags a stalled EMI/Loan bill with zero recorded payments", () => {
    const commitments = [{ id: "c1", name: "Personal loan", category: "Loan", remainingAmount: 50000, payments: [] }];
    const result = buildQuarterlyNarrative({ snapshots, entries, commitments });
    expect(result.stalledBillIds).toEqual(["c1"]);
    expect(result.beats.some((b) => b.key === "quarterlyNarrative.stalledBill")).toBe(true);
  });

  it("returns hasData:false with fewer than 2 snapshots", () => {
    expect(buildQuarterlyNarrative({ snapshots: [snapshots[0]], entries, commitments: [] }).hasData).toBe(false);
  });

  it("falls back to the no-driver beat when there are no assets", () => {
    const result = buildQuarterlyNarrative({ snapshots, entries: [], commitments: [] });
    expect(result.beats[0].key).toBe("quarterlyNarrative.netWorthGrew");
    expect(result.beats[0].params.driverName).toBeUndefined();
  });

  it("never produces a NaN delta when a stored snapshot has a corrupted/missing netWorth field", () => {
    const badSnapshots = [
      { month: "2025-04", netWorth: undefined, totalAssets: 1200000, totalLiabilities: 200000 },
      { month: "2025-06", netWorth: NaN, totalAssets: 1400000, totalLiabilities: 216000 },
    ];
    const result = buildQuarterlyNarrative({ snapshots: badSnapshots, entries, commitments: [] });
    expect(Number.isFinite(result.netWorthDelta)).toBe(true);
    expect(result.netWorthDelta).toBe(0);
    expect(result.beats[0].params.amount).not.toContain("NaN");
  });
});

describe("quarterBoundsForMonth / snapshotsInQuarter", () => {
  it("computes Apr-Jun bounds for a June month key", () => {
    expect(quarterBoundsForMonth("2025-06")).toEqual({ year: 2025, startMonth: 4, endMonth: 6 });
  });

  it("filters snapshots to only those within the quarter", () => {
    const snapshots = [
      { month: "2025-03", netWorth: 1 },
      { month: "2025-04", netWorth: 2 },
      { month: "2025-06", netWorth: 3 },
      { month: "2025-07", netWorth: 4 },
    ];
    const result = snapshotsInQuarter(snapshots, "2025-05");
    expect(result.map((s) => s.month)).toEqual(["2025-04", "2025-06"]);
  });
});
