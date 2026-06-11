import { describe, expect, it } from "vitest";
import { buildMonthlySnapshot, compareSnapshotTrend } from "../snapshots.js";

const pending = () => "pending";

describe("buildMonthlySnapshot", () => {
  it("builds snapshot with pressure score and savings rate", () => {
    const snap = buildMonthlySnapshot(
      "2026-06",
      [{ amount: 20000, repeatType: "monthly", remainingAmount: 0 }],
      80000,
      pending,
      [],
    );
    expect(snap.month).toBe("2026-06");
    expect(snap.pressureScore).toBeGreaterThan(0);
    expect(snap.savingsRate).toBeGreaterThan(0);
    expect(snap.trend).toBeNull();
  });

  it("includes month-over-month trend when prior snapshot exists", () => {
    const prev = buildMonthlySnapshot(
      "2026-05",
      [{ amount: 15000, repeatType: "monthly", remainingAmount: 0 }],
      80000,
      pending,
      [],
    );
    const snap = buildMonthlySnapshot(
      "2026-06",
      [{ amount: 35000, repeatType: "monthly", remainingAmount: 0 }],
      80000,
      pending,
      [prev],
    );
    expect(snap.trend).toBeTruthy();
    expect(snap.trend.pressureDelta).toBeGreaterThan(0);
    expect(snap.trend.trendKey).toBe("snapshot.trend.rising");
  });
});

describe("compareSnapshotTrend", () => {
  it("flags improving when pressure drops", () => {
    const t = compareSnapshotTrend({ pressureScore: 40, freeMoney: 50000, monthlyBurden: 30000, overdueSum: 0 }, {
      pressureScore: 55,
      freeMoney: 40000,
      monthlyBurden: 35000,
      overdueSum: 0,
    });
    expect(t.improving).toBe(true);
    expect(t.trendKey).toBe("snapshot.trend.easing");
  });
});
