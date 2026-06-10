import { describe, expect, it } from "vitest";
import { buildMonthlySnapshot } from "../snapshots.js";

const pending = () => "pending";

describe("buildMonthlySnapshot", () => {
  it("builds snapshot with pressure score", () => {
    const snap = buildMonthlySnapshot(
      "2026-06",
      [{ amount: 20000, repeatType: "monthly", remainingAmount: 0 }],
      80000,
      pending,
      [],
    );
    expect(snap.month).toBe("2026-06");
    expect(snap.pressureScore).toBeGreaterThan(0);
  });
});
