import { describe, expect, it } from "vitest";
import { computeSafeToSpendDaily } from "../safeToSpend.js";

describe("computeSafeToSpendDaily", () => {
  it("divides buffer by days until next salary", () => {
    const r = computeSafeToSpendDaily({
      bufferAfterBills: 14000,
      salaryCreditDay: 15,
      todayStr: "2026-06-10",
    });
    expect(r.daysUntilSalary).toBeGreaterThan(0);
    expect(r.daily).toBeGreaterThan(0);
    expect(r.daily).toBeLessThanOrEqual(14000);
  });

  it("returns zero when salary day not set", () => {
    const r = computeSafeToSpendDaily({ bufferAfterBills: 10000, todayStr: "2026-06-10" });
    expect(r.daily).toBe(0);
  });
});
