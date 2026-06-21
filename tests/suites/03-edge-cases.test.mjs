import { describe, it, expect } from "vitest";
import { computeCanonicalPressureScore } from "../../src/engines/pressureScore.js";
import { computeSurvivalAnalysis } from "../../src/engines/survival.js";
import { estimateIncomeTax } from "../../src/engines/incomeTaxEstimate.js";
import { computeChitIrr } from "../../src/engines/chitFund.js";
import { INCOME, STATUS, COMMITMENT, TODAY, makeCommitments } from "../fixtures.mjs";

const isFiniteNum = (v) => typeof v === "number" && isFinite(v) && !isNaN(v);

describe("MONKEY: extreme inputs that should never crash", () => {
  const EXTREME_AMOUNTS = [0, -1, -Infinity, Infinity, NaN, 0.001, 0.0001, Number.MAX_SAFE_INTEGER, 1e15, -1e15];

  EXTREME_AMOUNTS.forEach((amount) => {
    it(`[P0] pressureScore with amount=${amount} doesn't return NaN/Infinity`, () => {
      let score;
      expect(() => {
        score = computeCanonicalPressureScore({
          commitments: [
            {
              ...COMMITMENT.normal,
              amount,
              remainingAmount: Math.max(0, isFinite(amount) ? amount : 0),
            },
          ],
          income: INCOME.average,
          getEffectiveStatus: STATUS.pending,
        });
      }).not.toThrow();
      if (score !== undefined) {
        expect(isFiniteNum(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });
  });

  const EXTREME_INCOMES = [0, -1, -50000, Infinity, NaN, 0.001, 1e15];

  EXTREME_INCOMES.forEach((income) => {
    it(`[P0] pressureScore with income=${income} doesn't crash`, () => {
      let score;
      expect(() => {
        score = computeCanonicalPressureScore({
          commitments: [COMMITMENT.normal],
          income,
          getEffectiveStatus: STATUS.pending,
        });
      }).not.toThrow();
      if (score !== undefined) expect(isFiniteNum(score)).toBe(true);
    });
  });

  it("[P0] pressureScore with null commitments doesn't crash", () => {
    expect(() =>
      computeCanonicalPressureScore({
        commitments: null,
        income: INCOME.average,
        getEffectiveStatus: STATUS.pending,
      }),
    ).not.toThrow();
  });

  it("[P0] pressureScore with undefined commitments doesn't crash", () => {
    expect(() =>
      computeCanonicalPressureScore({
        commitments: undefined,
        income: INCOME.average,
        getEffectiveStatus: STATUS.pending,
      }),
    ).not.toThrow();
  });

  it("[P1] 200 commitments — performance + no crash", () => {
    const start = Date.now();
    expect(() =>
      computeCanonicalPressureScore({
        commitments: makeCommitments(200, 100),
        income: INCOME.high,
        getEffectiveStatus: STATUS.pending,
      }),
    ).not.toThrow();
    expect(Date.now() - start).toBeLessThan(3000);
  }, 10000);

  it("[P1] income tax with all zeros doesn't crash", () => {
    expect(() =>
      estimateIncomeTax({
        annualGrossIncome: 0,
        deduction80c: 0,
        deduction80d: 0,
      }),
    ).not.toThrow();
  });

  it("[P1] income tax with null values doesn't crash", () => {
    expect(() =>
      estimateIncomeTax({
        annualGrossIncome: null,
        deduction80c: null,
      }),
    ).not.toThrow();
  });

  it("[P1] chit fund IRR with short cashflows doesn't divide by zero", () => {
    expect(() => computeChitIrr([-1000, 11000])).not.toThrow();
  });

  it("[P1] chit fund IRR with zero payout", () => {
    expect(() => computeChitIrr([-1000, 0])).not.toThrow();
  });

  it("[P2] survival with undefined savings doesn't crash", () => {
    expect(() =>
      computeSurvivalAnalysis({
        income: INCOME.average,
        freeMoney: 10000,
        liquidSavings: undefined,
        monthlyBurden: 5000,
        todayStr: TODAY,
      }),
    ).not.toThrow();
  });
});
