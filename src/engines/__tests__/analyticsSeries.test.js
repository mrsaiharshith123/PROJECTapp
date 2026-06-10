import { describe, expect, it } from "vitest";
import { snapshotsToPressureTrend } from "../analyticsSeries.js";

describe("snapshotsToPressureTrend", () => {
  it("maps snapshot months to trend rows", () => {
    const rows = snapshotsToPressureTrend(
      [{ month: "2026-05", pressureScore: 55, openRemainingSum: 10000, freeMoney: 20000 }],
      3,
    );
    expect(rows.length).toBe(3);
    expect(rows.some((r) => r.pressure === 55)).toBe(true);
  });
});
