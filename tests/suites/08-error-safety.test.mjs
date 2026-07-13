import { describe, it, expect } from "vitest";
import { computeCanonicalPressureScore } from "../../src/engines/pressureScore.js";
import { computeSurvivalAnalysis } from "../../src/engines/survival.js";
import { computeSafeToSpendDaily } from "../../src/engines/safeToSpend.js";
import { numberToWords } from "../../src/utils/numberToWords.js";
import { canAddLendingRecord } from "../../src/utils/tierAccess.js";
import { INCOME, STATUS, COMMITMENT, SETTINGS, TODAY, makeLendings } from "../fixtures.mjs";

describe("ERROR SAFETY: graceful degradation", () => {
  it("[P0] pressureScore with empty object args doesn't throw", () => {
    expect(() => computeCanonicalPressureScore({})).not.toThrow();
  });

  it("[P0] survival with empty object args doesn't throw", () => {
    expect(() => computeSurvivalAnalysis({})).not.toThrow();
  });

  it("[P0] safeToSpend with empty object args doesn't throw", () => {
    expect(() => computeSafeToSpendDaily({})).not.toThrow();
  });

  it("[P0] numberToWords with undefined doesn't throw", () => {
    expect(() => numberToWords(undefined)).not.toThrow();
  });

  it("[P1] canAddLendingRecord with null settings defaults to free tier limits", () => {
    const result = canAddLendingRecord(null, makeLendings(0));
    expect(result.ok).toBe(true);
    const atLimit = canAddLendingRecord(null, makeLendings(5));
    expect(atLimit.ok).toBe(false);
  });

  it("[P1] canAddLendingRecord with null lendings array treats as empty", () => {
    const result = canAddLendingRecord(SETTINGS.free, null);
    expect(result.ok).toBe(true);
  });

  it("[P2] pressureScore returns number even with malformed commitment", () => {
    const score = computeCanonicalPressureScore({
      commitments: [{ id: "bad" }],
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(typeof score).toBe("number");
    expect(Number.isFinite(score)).toBe(true);
  });

  it("[P2] survival returns object with survivalMonths key", () => {
    const result = computeSurvivalAnalysis({
      income: INCOME.average,
      freeMoney: 5000,
      liquidSavings: 10000,
      monthlyBurden: 8000,
      todayStr: TODAY,
    });
    expect(result).toHaveProperty("survivalMonths");
  });
});
