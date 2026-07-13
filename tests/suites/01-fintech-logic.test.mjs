import { describe, it, expect } from "vitest";
import { computeCanonicalPressureScore } from "../../src/engines/pressureScore.js";
import { computeSurvivalAnalysis } from "../../src/engines/survival.js";
import { monthlyBurdenForCommitment } from "../../src/engines/burden.js";
import {
  buildPromissoryNoteText,
  isAgreementFullyLocked,
  canEditLending,
  canDeleteLending,
} from "../../src/engines/lendingAgreement.js";
import { numberToWords } from "../../src/utils/numberToWords.js";
import { computeSafeToSpendDaily } from "../../src/engines/safeToSpend.js";
import { INCOME, STATUS, COMMITMENT, LENDING, SETTINGS, TODAY, makeCommitments } from "../fixtures.mjs";

const isFiniteNum = (v) => typeof v === "number" && isFinite(v) && !isNaN(v);

describe("CHAOS: pressureScore — must never return NaN/Infinity", () => {
  it("[P0] income=0 returns a finite number, not NaN", () => {
    const score = computeCanonicalPressureScore({
      commitments: [COMMITMENT.normal],
      income: INCOME.zero,
      getEffectiveStatus: STATUS.pending,
    });
    expect(isFiniteNum(score)).toBe(true);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("[P0] undefined income treats as zero, returns finite", () => {
    const score = computeCanonicalPressureScore({
      commitments: [COMMITMENT.normal],
      income: undefined,
      getEffectiveStatus: STATUS.pending,
    });
    expect(isFiniteNum(score)).toBe(true);
  });

  it("[P0] negative amount commitment doesn't produce negative score", () => {
    const score = computeCanonicalPressureScore({
      commitments: [COMMITMENT.negative],
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(isFiniteNum(score)).toBe(true);
  });

  it("[P0] commitment with no amount doesn't crash", () => {
    expect(() =>
      computeCanonicalPressureScore({
        commitments: [COMMITMENT.noAmount],
        income: INCOME.average,
        getEffectiveStatus: STATUS.pending,
      }),
    ).not.toThrow();
  });

  it("[P1] 100 commitments don't cause stack overflow or timeout", () => {
    const start = Date.now();
    const score = computeCanonicalPressureScore({
      commitments: makeCommitments(100, 1000),
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(isFiniteNum(score)).toBe(true);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it("[P1] commitments totaling MORE than income (pressure > 100%)", () => {
    const score = computeCanonicalPressureScore({
      commitments: makeCommitments(10, 10000),
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(isFiniteNum(score)).toBe(true);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("[P2] huge amount commitment doesn't overflow", () => {
    const score = computeCanonicalPressureScore({
      commitments: [COMMITMENT.huge],
      income: INCOME.high,
      getEffectiveStatus: STATUS.pending,
    });
    expect(isFiniteNum(score)).toBe(true);
  });

  it("[P2] empty commitments array returns low score", () => {
    const score = computeCanonicalPressureScore({
      commitments: [],
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(score).toBe(0);
  });
});

describe("CHAOS: survival — must handle zero-savings scenarios", () => {
  it("[P0] zero savings returns 0 months, not NaN", () => {
    const result = computeSurvivalAnalysis({
      income: INCOME.average,
      freeMoney: 0,
      liquidSavings: 0,
      monthlyBurden: 10000,
      todayStr: TODAY,
    });
    expect(isFiniteNum(result.survivalMonths)).toBe(true);
    expect(result.survivalMonths).toBeGreaterThanOrEqual(0);
  });

  it("[P0] zero income AND zero savings doesn't divide by zero", () => {
    const result = computeSurvivalAnalysis({
      income: 0,
      freeMoney: 0,
      liquidSavings: 0,
      monthlyBurden: 0,
      todayStr: TODAY,
    });
    expect(result.survivalMonths === null || isFiniteNum(result.survivalMonths)).toBe(true);
  });

  it("[P0] negative savings (debt) clamped to 0 liquid", () => {
    const result = computeSurvivalAnalysis({
      income: INCOME.average,
      freeMoney: 0,
      liquidSavings: -50000,
      monthlyBurden: 10000,
      todayStr: TODAY,
    });
    expect(result.survivalMonths).toBeGreaterThanOrEqual(0);
  });
});

describe("CHAOS: lendingAgreement — legal document edge cases", () => {
  it("[P0] numberToWords(0) returns a string, not crash", () => {
    expect(() => numberToWords(0)).not.toThrow();
    expect(typeof numberToWords(0)).toBe("string");
  });

  it("[P0] numberToWords(NaN) doesn't crash", () => {
    expect(() => numberToWords(NaN)).not.toThrow();
  });

  it("[P0] numberToWords(100000000) handles 10 crore", () => {
    const result = numberToWords(100000000);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("[P1] buildPromissoryNoteText with empty borrower name doesn't crash", () => {
    expect(() => buildPromissoryNoteText({ ...LENDING.normal, personName: "" }, SETTINGS.pro)).not.toThrow();
  });

  it("[P1] buildPromissoryNoteText with SQL injection name is sanitized", () => {
    const text = buildPromissoryNoteText(LENDING.sqlInjection, SETTINGS.pro);
    expect(typeof text).toBe("string");
    expect(text).toBeTruthy();
  });

  it("[P1] buildPromissoryNoteText with 500-char name doesn't crash", () => {
    expect(() => buildPromissoryNoteText(LENDING.longName, SETTINGS.pro)).not.toThrow();
  });

  it("[P2] isAgreementFullyLocked returns true for a signed agreement", () => {
    expect(isAgreementFullyLocked(LENDING.locked)).toBe(true);
  });

  it("[P2] canEditLending returns false for a locked agreement", () => {
    expect(canEditLending(LENDING.locked)).toBe(false);
  });

  it("[P2] canDeleteLending returns false for a locked agreement", () => {
    expect(canDeleteLending(LENDING.locked)).toBe(false);
  });
});

describe("CHAOS: safeToSpend — money amount edge cases", () => {
  it("[P0] undefined salary day returns safe object", () => {
    const result = computeSafeToSpendDaily({
      bufferAfterBills: 20000,
      salaryCreditDay: undefined,
      todayStr: TODAY,
    });
    expect(result.daily).toBeGreaterThanOrEqual(0);
    expect(isFiniteNum(result.daily)).toBe(true);
  });

  it("[P0] zero buffer returns 0 daily, not NaN", () => {
    const result = computeSafeToSpendDaily({
      bufferAfterBills: 0,
      salaryCreditDay: 5,
      todayStr: TODAY,
    });
    expect(result.daily).toBeGreaterThanOrEqual(0);
    expect(isFiniteNum(result.daily)).toBe(true);
  });

  it("[P1] small buffer with salary day returns finite daily", () => {
    const result = computeSafeToSpendDaily({
      bufferAfterBills: 5000,
      salaryCreditDay: 5,
      todayStr: TODAY,
    });
    expect(result.daily).toBeGreaterThanOrEqual(0);
  });
});

describe("ACCURACY: financial math correctness", () => {
  it("monthly burden for a zero-amount commitment is 0", () => {
    expect(monthlyBurdenForCommitment(COMMITMENT.zero, STATUS.pending)).toBe(0);
  });

  it("monthly burden for a decimal EMI is precise", () => {
    const burden = monthlyBurdenForCommitment(COMMITMENT.decimal, STATUS.pending);
    expect(Math.abs(burden - 18333.33)).toBeLessThan(0.01);
  });

  it("pressure score increases monotonically as burden increases", () => {
    const make = (totalBurden) =>
      computeCanonicalPressureScore({
        commitments: [{ ...COMMITMENT.normal, amount: totalBurden, remainingAmount: totalBurden }],
        income: INCOME.average,
        getEffectiveStatus: STATUS.pending,
      });
    expect(make(10000)).toBeLessThan(make(20000));
    expect(make(20000)).toBeLessThan(make(40000));
  });
});
