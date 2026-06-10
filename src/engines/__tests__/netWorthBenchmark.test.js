import { describe, expect, it } from "vitest";
import { benchmarkNetWorth } from "../netWorthBenchmark.js";

describe("benchmarkNetWorth", () => {
  it("returns peer median and insight", () => {
    const r = benchmarkNetWorth({ netWorth: 500_000, monthlyIncome: 80_000, age: 32 });
    expect(r.peerMedian).toBeGreaterThan(0);
    expect(r.insightId).toBeTruthy();
  });
});
