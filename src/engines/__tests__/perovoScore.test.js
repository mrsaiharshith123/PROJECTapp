import { describe, expect, it } from "vitest";
import { computePerovoScore, debtHealthToScore, pillarTrend } from "../perovoScore.js";

describe("perovoScore", () => {
  it("returns headline score and four pillars in 0–100", () => {
    const r = computePerovoScore({
      pressureScore: 30,
      billPortfolioScore: 80,
      health: { bufferScore: 70, behaviourScore: 75, trajectoryScore: 60 },
      emergencyProgressPercent: 50,
      debtHealthScore: 72,
      creditUtilizationPercent: 20,
      goalsOnTrackRatio: 0.8,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(r.tier.id).toBeTruthy();
    expect(r.pillars.cashflow.score).toBeGreaterThan(50);
    expect(r.pillars.savings.score).toBeGreaterThan(0);
    expect(r.pillars.debt.score).toBeGreaterThan(0);
    expect(r.pillars.protection.score).toBeGreaterThan(0);
  });

  it("assigns at_risk tier below 40", () => {
    const r = computePerovoScore({
      pressureScore: 95,
      billPortfolioScore: 20,
      health: { bufferScore: 10, behaviourScore: 10, trajectoryScore: 10 },
      emergencyProgressPercent: 5,
      debtHealthScore: 15,
      creditUtilizationPercent: 90,
      goalsOnTrackRatio: 0,
    });
    expect(r.tier.id).toBe("at_risk");
  });

  it("detects pillar trend direction", () => {
    expect(pillarTrend(55, 50)).toBe("up");
    expect(pillarTrend(44, 50)).toBe("down");
    expect(pillarTrend(51, 50)).toBe("flat");
    expect(pillarTrend(null, 50)).toBe(null);
  });

  it("maps debt health pressure to 0–100", () => {
    expect(debtHealthToScore({ emiOverloadPct: 10, pressureLevel: "low", highRiskDebtCount: 0 })).toBeGreaterThan(
      70,
    );
    expect(
      debtHealthToScore({ emiOverloadPct: 60, pressureLevel: "critical", highRiskDebtCount: 2 }),
    ).toBeLessThan(40);
  });
});
