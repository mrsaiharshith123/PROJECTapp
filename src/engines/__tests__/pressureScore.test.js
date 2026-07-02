import { describe, it, expect } from "vitest";
import {
  computeCanonicalPressureScore,
  computePressureAnalysis,
  freeMoneyAfterBurden,
  pressureScoreLabel,
  commitmentToIncomeRatio,
  yearlyBurdenEstimate,
} from "../pressureScore.js";

const getStatus = () => "active";
const bill = (amount) => ({
  amount,
  repeatType: "monthly",
  startDate: "2024-01-01",
  categoryId: "emi",
});

describe("pressureScore", () => {
  it("returns 0 score when income=0 and no commitments", () => {
    const r = computeCanonicalPressureScore({
      commitments: [],
      income: 0,
      getEffectiveStatus: getStatus,
    });
    expect(r).toBe(0);
  });

  it("score rises proportionally with burden ratio", () => {
    const low = computeCanonicalPressureScore({
      commitments: [bill(10000)],
      income: 100000,
      getEffectiveStatus: getStatus,
    });
    const high = computeCanonicalPressureScore({
      commitments: [bill(70000)],
      income: 100000,
      getEffectiveStatus: getStatus,
    });
    expect(high).toBeGreaterThan(low);
  });

  it("never returns NaN or Infinity", () => {
    const r = computeCanonicalPressureScore({
      commitments: [bill(999999)],
      income: 0,
      getEffectiveStatus: getStatus,
    });
    expect(Number.isFinite(r)).toBe(true);
  });

  it("freeMoneyAfterBurden clamps when burden exceeds income", () => {
    const { freeMoney } = freeMoneyAfterBurden([bill(200000)], 100000, getStatus);
    expect(freeMoney).toBeLessThanOrEqual(0);
  });

  it("pressureScoreLabel returns structured label for boundary scores", () => {
    [0, 25, 50, 75, 100].forEach((score) => {
      const r = pressureScoreLabel(score);
      expect(typeof r.label).toBe("string");
      expect(typeof r.level).toBe("string");
    });
  });

  it("commitmentToIncomeRatio and yearlyBurdenEstimate are finite", () => {
    const ratio = commitmentToIncomeRatio([bill(20000)], 100000, getStatus);
    const yearly = yearlyBurdenEstimate([bill(20000)], getStatus);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(yearly).toBe(240000);
  });

  it("computePressureAnalysis returns analysis object", () => {
    const a = computePressureAnalysis({
      commitments: [bill(10000)],
      income: 50000,
      getEffectiveStatus: getStatus,
      todayStr: "2025-06-15",
    });
    expect(Number.isFinite(a.score)).toBe(true);
    expect(typeof a.trendDirection).toBe("string");
  });
});
