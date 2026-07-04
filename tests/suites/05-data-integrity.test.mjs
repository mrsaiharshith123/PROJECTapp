import { describe, it, expect } from "vitest";
import {
  yearlyInrAfterSave,
  effectiveAnnualMonthlyInr,
  PLAN_PRESENTATION,
  isFeatureUnlocked,
  YEARLY_SAVE_PERCENT,
} from "../../src/constants/subscriptionTiers.js";
import { FREE_TIER_LIMITS, PRO_CASHFLOW_DAYS } from "../../src/constants/tierLimits.js";
import { computeCanonicalPressureScore } from "../../src/engines/pressureScore.js";
import { monthlyBurdenForCommitment } from "../../src/engines/burden.js";
import { INCOME, STATUS, COMMITMENT, TODAY, makeCommitments } from "../fixtures.mjs";

describe("DATA INTEGRITY: subscription pricing math", () => {
  it("[P0] YEARLY_SAVE_PERCENT is 29 (any change breaks pricing)", () => {
    expect(YEARLY_SAVE_PERCENT).toBe(29);
  });

  it("[P0] Free tier limits are exactly as spec'd (no accidental changes)", () => {
    expect(FREE_TIER_LIMITS.activeLendingRecords).toBe(5);
    expect(FREE_TIER_LIMITS.activeChitRecords).toBe(2);
    expect(FREE_TIER_LIMITS.activeGoals).toBe(3);
    expect(FREE_TIER_LIMITS.billSplitsPerMonth).toBe(5);
    expect(FREE_TIER_LIMITS.billSplitParticipants).toBe(3);
    expect(FREE_TIER_LIMITS.cashflowDays).toBe(30);
  });

  it("[P0] Pro cashflow days is exactly 90", () => {
    expect(PRO_CASHFLOW_DAYS).toBe(90);
  });

  it("[P1] yearlyInrAfterSave(0) returns 0, not crash", () => {
    expect(yearlyInrAfterSave(0)).toBe(0);
    expect(yearlyInrAfterSave(null)).toBe(0);
    expect(yearlyInrAfterSave(undefined)).toBe(0);
  });

  it("[P1] effectiveAnnualMonthlyInr(0) returns 0, not divide-by-zero", () => {
    expect(effectiveAnnualMonthlyInr(0)).toBe(0);
    expect(effectiveAnnualMonthlyInr(null)).toBe(0);
  });

  it("[P2] PLAN_PRESENTATION has exactly 2 plans (free, pro)", () => {
    const tiers = PLAN_PRESENTATION.map((p) => p.tier);
    expect(tiers).toContain("free");
    expect(tiers).toContain("pro");
    expect(tiers).toHaveLength(2);
  });

  it("[P2] Pro plan annual price is less than monthly × 12", () => {
    const pro = PLAN_PRESENTATION.find((p) => p.tier === "pro");
    if (pro?.monthlyInr && pro?.annualInr) {
      expect(pro.annualInr).toBeLessThan(pro.monthlyInr * 12);
    }
  });

  it("[P2] isFeatureUnlocked never throws on any input combination", () => {
    const tiers = ["free", "pro", "power", null, undefined, "", "platinum", "POWER"];
    const features = ["ai_advisor", "legal_agreement", "bond_advisor", "fake_feature", null, ""];
    for (const t of tiers) {
      for (const f of features) {
        expect(() => isFeatureUnlocked(f, t)).not.toThrow();
      }
    }
  });
});

describe("DATA INTEGRITY: engine totals and consistency", () => {
  it("[P1] pressure score is always 0–100 inclusive", () => {
    const score = computeCanonicalPressureScore({
      commitments: makeCommitments(20, 5000),
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("[P1] monthly burden for paid commitment is 0", () => {
    const paid = { ...COMMITMENT.normal, status: "paid", remainingAmount: 0 };
    expect(monthlyBurdenForCommitment(paid, STATUS.paid)).toBe(0);
  });

  it("[P1] same inputs produce same pressure score (deterministic)", () => {
    const args = {
      commitments: [COMMITMENT.normal],
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    };
    expect(computeCanonicalPressureScore(args)).toBe(computeCanonicalPressureScore(args));
  });

  it("[P2] adding commitments never decreases pressure score", () => {
    const base = computeCanonicalPressureScore({
      commitments: [COMMITMENT.normal],
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    const more = computeCanonicalPressureScore({
      commitments: [COMMITMENT.normal, { ...COMMITMENT.normal, id: "extra" }],
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(more).toBeGreaterThanOrEqual(base);
  });
});
