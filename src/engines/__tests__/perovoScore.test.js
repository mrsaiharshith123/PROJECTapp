import { describe, it, expect } from "vitest";
import { computePerovoScore } from "../perovoScore.js";

describe("perovoScore", () => {
  it("returns a numeric total score", () => {
    const r = computePerovoScore({
      pressureScore: 40,
      billPortfolioScore: 70,
      health: { bufferScore: 60 },
      emergencyProgressPercent: 50,
      debtHealthScore: 65,
    });
    expect(typeof r.score).toBe("number");
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("never returns NaN with zero inputs", () => {
    const r = computePerovoScore({});
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it("returns pillar breakdown", () => {
    const r = computePerovoScore({ pressureScore: 30, billPortfolioScore: 80 });
    expect(r.pillars).toBeTruthy();
    expect(r.tier?.id).toBeTruthy();
  });

  it("higher pressure yields lower score", () => {
    const low = computePerovoScore({ pressureScore: 20, billPortfolioScore: 70 });
    const high = computePerovoScore({ pressureScore: 80, billPortfolioScore: 70 });
    expect(low.score).toBeGreaterThan(high.score);
  });
});
