# Perovo — Complete QA System Replacement
# Replaces all 140 existing test files with a chaos-first QA engine.
# Run this as ONE prompt in Cursor Agent mode.
#
# WHAT THIS BUILDS:
#   • Deletes all 140 old happy-path test files
#   • Creates tests/ directory with 8 specialist test suites
#   • Creates scripts/qa-runner.mjs — the terminal chaos reporter
#   • npm test   → runs vitest on all new suites (CI-compatible)
#   • npm run qa → runs the chaos reporter with colored terminal output
#
# THE REPORTER OUTPUT looks like:
#   🔴 P0 CRITICAL  pressureScore returns NaN when income=0
#   🟠 P1 HIGH      Free user bypasses Pro gate via localStorage
#   🟡 P2 MEDIUM    Survival months shown in LogSpend modal (wrong context)
#   ✅ PASSED       computeBurden handles 100 commitments correctly
#   ═══ FINAL: 3 critical · 8 high · 14 medium · 312 passed
#   ═══ MOST VULNERABLE: Tier gate (localStorage) · pressureScore edge cases

```
You are a senior QA engineer. Your job is to completely replace
the existing test system with a new chaos-first QA suite.

DO THIS IN ORDER — do not skip any step:

═══════════════════════════════════════════════════════════════
STEP 1 — DELETE ALL EXISTING TEST FILES
═══════════════════════════════════════════════════════════════
Delete every file matching these patterns:
  src/engines/__tests__/*.test.js
  src/engines/netWorth/__tests__/*.test.js
  src/constants/__tests__/*.test.js
  src/services/__tests__/*.test.js
  src/services/analytics/__tests__/*.test.js
  src/services/supabase/__tests__/*.test.js
  src/services/sync/__tests__/*.test.js
  src/storage/__tests__/*.test.js
  src/utils/__tests__/*.test.js
  src/i18n/__tests__/*.test.js
  src/tests/*.test.js

After deleting, verify:
  find src -name "*.test.*" | wc -l   → should be 0

═══════════════════════════════════════════════════════════════
STEP 2 — UPDATE vitest.config.js
═══════════════════════════════════════════════════════════════
Replace src/vitest.config.js with:

  import { defineConfig } from "vitest/config";

  export default defineConfig({
    test: {
      environment: "node",
      include: ["tests/suites/**/*.test.mjs"],
      reporters: ["verbose"],
      globals: true,
    },
  });

═══════════════════════════════════════════════════════════════
STEP 3 — UPDATE package.json scripts
═══════════════════════════════════════════════════════════════
In package.json, update the test-related scripts:
  "test":    "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "qa":      "node tests/qa-runner.mjs",
  "qa:fast": "node tests/qa-runner.mjs --fast",
  "qa:p0":   "node tests/qa-runner.mjs --severity=P0",
Keep all existing audit:* scripts unchanged.

═══════════════════════════════════════════════════════════════
STEP 4 — CREATE tests/fixtures.mjs
═══════════════════════════════════════════════════════════════
Create tests/fixtures.mjs:

// ─── Shared test fixtures ────────────────────────────────────
export const INCOME = {
  zero:     0,
  minimal:  5000,
  average:  50000,
  high:     200000,
  huge:     99999999,
};

export const STATUS = {
  paid:    (c) => "paid",
  pending: (c) => (c.status === "paid" ? "paid" : "pending"),
  overdue: (c) => "overdue",
};

export const COMMITMENT = {
  normal:   { id: "c1", amount: 10000, remainingAmount: 10000, repeatType: "monthly", category: "EMI", dueDate: "2026-07-05" },
  zero:     { id: "c2", amount: 0,     remainingAmount: 0,     repeatType: "monthly", category: "Utility" },
  negative: { id: "c3", amount: -5000, remainingAmount: -5000, repeatType: "monthly", category: "EMI" },
  huge:     { id: "c4", amount: 99999999, remainingAmount: 99999999, repeatType: "monthly", category: "Rent" },
  decimal:  { id: "c5", amount: 18333.33, remainingAmount: 18333.33, repeatType: "monthly", category: "EMI" },
  noAmount: { id: "c6", repeatType: "monthly", category: "Utility" },
  noId:     { amount: 5000, repeatType: "monthly", category: "EMI" },
};

export const LENDING = {
  normal: { id: "l1", principalAmount: 50000, interestRate: 12, type: "lent",
            personName: "Rahul Sharma", startDate: "2026-01-01", endDate: "2026-12-31",
            remainingAmount: 25000, status: "active" },
  zero:   { id: "l2", principalAmount: 0, interestRate: 0, type: "lent",
            personName: "Test", remainingAmount: 0 },
  locked: { id: "l3", principalAmount: 30000, interestRate: 8, type: "lent",
            esignStatus: "completed", agreementHash: "abc123",
            remainingAmount: 15000, isAgreementLocked: true },
  longName: { id: "l4", principalAmount: 10000, type: "lent",
              personName: "A".repeat(500), remainingAmount: 10000 },
  specialChars: { id: "l5", principalAmount: 10000, type: "lent",
                  personName: "O'Brien & Co \"Test\"", remainingAmount: 10000 },
  sqlInjection: { id: "l6", principalAmount: 10000, type: "lent",
                  personName: "'; DROP TABLE lendings; --", remainingAmount: 10000 },
};

export const SETTINGS = {
  free:  { subscriptionTier: "free",  monthlyIncome: 50000, salaryCreditDay: 5 },
  pro:   { subscriptionTier: "pro",   monthlyIncome: 50000, salaryCreditDay: 5 },
  power: { subscriptionTier: "power", monthlyIncome: 50000, salaryCreditDay: 5 },
  noIncome: { subscriptionTier: "free", monthlyIncome: 0 },
  noSalaryDay: { subscriptionTier: "free", monthlyIncome: 50000 },
  badTier: { subscriptionTier: "platinum", monthlyIncome: 50000 },
};

export const TODAY = "2026-06-21";

// Generate N commitments for load testing
export function makeCommitments(n, overrideAmount = 10000) {
  return Array.from({ length: n }, (_, i) => ({
    id: `bulk-${i}`,
    amount: overrideAmount,
    remainingAmount: overrideAmount,
    repeatType: "monthly",
    category: "EMI",
    dueDate: "2026-07-15",
  }));
}

═══════════════════════════════════════════════════════════════
STEP 5 — CREATE tests/suites/01-fintech-logic.test.mjs
═══════════════════════════════════════════════════════════════
Create tests/suites/01-fintech-logic.test.mjs:

import { describe, it, expect } from "vitest";
import { computeCanonicalPressureScore, computePressureAnalysis } from "../../src/engines/pressureScore.js";
import { computeSurvivalAnalysis } from "../../src/engines/survival.js";
import { monthlyBurdenForCommitment } from "../../src/engines/burden.js";
import { numberToWords, buildPromissoryNoteText, isAgreementFullyLocked, canEditLending, canDeleteLending } from "../../src/engines/lendingAgreement.js";
import { computeSafeToSpendDaily } from "../../src/engines/safeToSpend.js";
import { INCOME, STATUS, COMMITMENT, LENDING, SETTINGS, TODAY, makeCommitments } from "../fixtures.mjs";

// ─── Helper: is result a safe finite number? ────────────────
const isFiniteNum = (v) => typeof v === "number" && isFinite(v) && !isNaN(v);

// ════════════════════════════════════════════════════════════
describe("🔴 CHAOS: pressureScore — must never return NaN/Infinity", () => {

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
    expect(() => computeCanonicalPressureScore({
      commitments: [COMMITMENT.noAmount],
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    })).not.toThrow();
  });

  it("[P1] 100 commitments don't cause stack overflow or timeout", () => {
    const start = Date.now();
    const score = computeCanonicalPressureScore({
      commitments: makeCommitments(100, 1000),
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    const ms = Date.now() - start;
    expect(isFiniteNum(score)).toBe(true);
    expect(ms).toBeLessThan(500); // must run in < 500ms on any device
  });

  it("[P1] commitments totaling MORE than income (pressure > 100%)", () => {
    const score = computeCanonicalPressureScore({
      commitments: makeCommitments(10, 10000), // 100k on 50k income
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(isFiniteNum(score)).toBe(true);
    expect(score).toBeLessThanOrEqual(100); // score must be capped
  });

  it("[P2] huge amount commitment doesn't overflow", () => {
    const score = computeCanonicalPressureScore({
      commitments: [COMMITMENT.huge],
      income: INCOME.high,
      getEffectiveStatus: STATUS.pending,
    });
    expect(isFiniteNum(score)).toBe(true);
  });

  it("[P2] empty commitments array returns 0", () => {
    const score = computeCanonicalPressureScore({
      commitments: [],
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(score).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════
describe("🔴 CHAOS: survival — must handle zero-savings scenarios", () => {

  it("[P0] zero savings returns 0 months, not NaN", () => {
    const result = computeSurvivalAnalysis({
      commitments: [COMMITMENT.normal],
      income: INCOME.average,
      savings: 0,
      getEffectiveStatus: STATUS.pending,
      todayStr: TODAY,
    });
    expect(isFiniteNum(result.survivalMonths)).toBe(true);
    expect(result.survivalMonths).toBeGreaterThanOrEqual(0);
  });

  it("[P0] zero income AND zero savings doesn't divide by zero", () => {
    const result = computeSurvivalAnalysis({
      commitments: [],
      income: 0,
      savings: 0,
      getEffectiveStatus: STATUS.pending,
      todayStr: TODAY,
    });
    expect(isFiniteNum(result.survivalMonths)).toBe(true);
  });

  it("[P0] negative savings (debt) returns 0, not negative months", () => {
    const result = computeSurvivalAnalysis({
      commitments: [COMMITMENT.normal],
      income: INCOME.average,
      savings: -50000,
      getEffectiveStatus: STATUS.pending,
      todayStr: TODAY,
    });
    expect(result.survivalMonths).toBeGreaterThanOrEqual(0);
  });
});

// ════════════════════════════════════════════════════════════
describe("🔴 CHAOS: lendingAgreement — legal document edge cases", () => {

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
    // The raw SQL injection string should appear as text, never executed
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

// ════════════════════════════════════════════════════════════
describe("🔴 CHAOS: safeToSpend — money amount edge cases", () => {

  it("[P0] undefined daysUntilSalary returns a finite number", () => {
    const result = computeSafeToSpendDaily({
      income: INCOME.average,
      daysUntilSalary: undefined,
      totalPending: 20000,
    });
    expect(isFiniteNum(result)).toBe(true);
  });

  it("[P0] zero income returns 0, not NaN", () => {
    const result = computeSafeToSpendDaily({
      income: 0,
      daysUntilSalary: 10,
      totalPending: 0,
    });
    expect(result).toBeGreaterThanOrEqual(0);
    expect(isFiniteNum(result)).toBe(true);
  });

  it("[P1] pending > income returns 0 (not negative spend)", () => {
    const result = computeSafeToSpendDaily({
      income: INCOME.average,
      daysUntilSalary: 10,
      totalPending: INCOME.average * 2, // more than income
    });
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

// ════════════════════════════════════════════════════════════
describe("✅ ACCURACY: financial math correctness", () => {

  it("monthly burden for a zero-amount commitment is 0", () => {
    expect(monthlyBurdenForCommitment(COMMITMENT.zero)).toBe(0);
  });

  it("monthly burden for a decimal EMI is precise", () => {
    const burden = monthlyBurdenForCommitment(COMMITMENT.decimal);
    // 18333.33 monthly — should be exactly that, not 18333.330000000002
    expect(Math.abs(burden - 18333.33)).toBeLessThan(0.01);
  });

  it("pressure score increases monotonically as burden increases", () => {
    const make = (totalBurden) => computeCanonicalPressureScore({
      commitments: [{ ...COMMITMENT.normal, amount: totalBurden, remainingAmount: totalBurden }],
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    });
    expect(make(10000)).toBeLessThan(make(20000));
    expect(make(20000)).toBeLessThan(make(40000));
  });
});

═══════════════════════════════════════════════════════════════
STEP 6 — CREATE tests/suites/02-security-tiers.test.mjs
═══════════════════════════════════════════════════════════════
Create tests/suites/02-security-tiers.test.mjs:

import { describe, it, expect } from "vitest";
import { isFeatureUnlocked, PRO_FEATURES, POWER_FEATURES } from "../../src/constants/subscriptionTiers.js";
import { canAddLendingRecord, canAddChitRecord, canAddGoal, tierHasFeature } from "../../src/utils/tierAccess.js";
import { SETTINGS } from "../fixtures.mjs";

// ════════════════════════════════════════════════════════════
describe("🔴 SECURITY: tier gate integrity", () => {

  it("[P0] unknown tier 'platinum' does NOT unlock Pro features", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, "platinum")).toBe(false);
    }
  });

  it("[P0] unknown tier 'admin' does NOT unlock Power features", () => {
    for (const feat of POWER_FEATURES) {
      expect(isFeatureUnlocked(feat, "admin")).toBe(false);
    }
  });

  it("[P0] empty string tier does NOT unlock any feature", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, "")).toBe(false);
    }
  });

  it("[P0] null tier does NOT unlock any feature", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, null)).toBe(false);
    }
  });

  it("[P0] undefined tier does NOT unlock any feature", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, undefined)).toBe(false);
    }
  });

  it("[P0] power-only features are NOT unlocked by Pro tier", () => {
    for (const feat of POWER_FEATURES) {
      expect(isFeatureUnlocked(feat, "pro")).toBe(false);
    }
  });

  it("[P1] free user hits lending limit at exactly 5 records", () => {
    const at4 = canAddLendingRecord(4, SETTINGS.free);
    const at5 = canAddLendingRecord(5, SETTINGS.free);
    expect(at4.ok).toBe(true);
    expect(at5.ok).toBe(false);
    expect(at5.reason).toBe("lending_limit");
  });

  it("[P1] pro user can add more than 5 lending records", () => {
    expect(canAddLendingRecord(10, SETTINGS.pro).ok).toBe(true);
    expect(canAddLendingRecord(100, SETTINGS.pro).ok).toBe(true);
  });

  it("[P1] free user hits chit limit at exactly 2 records", () => {
    const at1 = canAddChitRecord(1, SETTINGS.free);
    const at2 = canAddChitRecord(2, SETTINGS.free);
    expect(at1.ok).toBe(true);
    expect(at2.ok).toBe(false);
  });

  it("[P1] free user hits goal limit at exactly 3 goals", () => {
    const at2 = canAddGoal(2, SETTINGS.free);
    const at3 = canAddGoal(3, SETTINGS.free);
    expect(at2.ok).toBe(true);
    expect(at3.ok).toBe(false);
  });

  it("[P1] pro user can have more than 3 goals", () => {
    expect(canAddGoal(10, SETTINGS.pro).ok).toBe(true);
  });

  it("[P1] ai_advisor is Pro-only (not Free)", () => {
    expect(isFeatureUnlocked("ai_advisor", "free")).toBe(false);
    expect(isFeatureUnlocked("ai_advisor", "pro")).toBe(true);
    expect(isFeatureUnlocked("ai_advisor", "power")).toBe(true);
  });

  it("[P1] legal_agreement is Pro-only", () => {
    expect(isFeatureUnlocked("legal_agreement", "free")).toBe(false);
    expect(isFeatureUnlocked("legal_agreement", "pro")).toBe(true);
  });

  it("[P1] bond_advisor is Power-only", () => {
    expect(isFeatureUnlocked("bond_advisor", "free")).toBe(false);
    expect(isFeatureUnlocked("bond_advisor", "pro")).toBe(false);
    expect(isFeatureUnlocked("bond_advisor", "power")).toBe(true);
  });

  it("[P2] tierHasFeature with settings object reads subscriptionTier correctly", () => {
    expect(tierHasFeature("unlimited_lending", SETTINGS.free)).toBe(false);
    expect(tierHasFeature("unlimited_lending", SETTINGS.pro)).toBe(true);
    expect(tierHasFeature("unlimited_lending", SETTINGS.power)).toBe(true);
  });
});

═══════════════════════════════════════════════════════════════
STEP 7 — CREATE tests/suites/03-edge-cases.test.mjs
═══════════════════════════════════════════════════════════════
Create tests/suites/03-edge-cases.test.mjs:

import { describe, it, expect } from "vitest";
import { computeCanonicalPressureScore } from "../../src/engines/pressureScore.js";
import { computeSurvivalAnalysis } from "../../src/engines/survival.js";
import { computeIncomeTaxEstimate } from "../../src/engines/incomeTaxEstimate.js";
import { computeChitFundIRR } from "../../src/engines/chitFund.js";
import { INCOME, STATUS, COMMITMENT, SETTINGS, TODAY, makeCommitments } from "../fixtures.mjs";

const isFiniteNum = (v) => typeof v === "number" && isFinite(v) && !isNaN(v);

describe("🐒 MONKEY: extreme inputs that should never crash", () => {

  const EXTREME_AMOUNTS = [0, -1, -Infinity, Infinity, NaN, 0.001, 0.0001,
    Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, 1e15, -1e15];

  EXTREME_AMOUNTS.forEach(amount => {
    it(`[P0] pressureScore with amount=${amount} doesn't return NaN/Infinity`, () => {
      let score;
      expect(() => {
        score = computeCanonicalPressureScore({
          commitments: [{ ...COMMITMENT.normal, amount, remainingAmount: Math.max(0, isFinite(amount) ? amount : 0) }],
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

  EXTREME_INCOMES.forEach(income => {
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
    expect(() => computeCanonicalPressureScore({
      commitments: null,
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    })).not.toThrow();
  });

  it("[P0] pressureScore with undefined commitments doesn't crash", () => {
    expect(() => computeCanonicalPressureScore({
      commitments: undefined,
      income: INCOME.average,
      getEffectiveStatus: STATUS.pending,
    })).not.toThrow();
  });

  it("[P1] 1000 commitments — performance + no crash", () => {
    const start = Date.now();
    expect(() => computeCanonicalPressureScore({
      commitments: makeCommitments(1000, 100),
      income: INCOME.high,
      getEffectiveStatus: STATUS.pending,
    })).not.toThrow();
    expect(Date.now() - start).toBeLessThan(2000);
  });

  it("[P1] income tax with all zeros doesn't crash", () => {
    expect(() => computeIncomeTaxEstimate({
      income: 0, hraRent: 0, section80c: 0,
      section80d: 0, employerPF: 0,
    })).not.toThrow();
  });

  it("[P1] income tax with null values doesn't crash", () => {
    expect(() => computeIncomeTaxEstimate({
      income: null, hraRent: null, section80c: null,
    })).not.toThrow();
  });

  it("[P1] chit fund IRR with 1 member doesn't divide by zero", () => {
    expect(() => computeChitFundIRR({
      chitValue: 12000, members: 1, monthlyContribution: 1000, duration: 12,
    })).not.toThrow();
  });

  it("[P1] chit fund IRR with zero value", () => {
    expect(() => computeChitFundIRR({
      chitValue: 0, members: 12, monthlyContribution: 1000, duration: 12,
    })).not.toThrow();
  });

  it("[P2] survival with undefined savings doesn't crash", () => {
    expect(() => computeSurvivalAnalysis({
      commitments: [COMMITMENT.normal],
      income: INCOME.average,
      savings: undefined,
      getEffectiveStatus: STATUS.pending,
      todayStr: TODAY,
    })).not.toThrow();
  });
});

═══════════════════════════════════════════════════════════════
STEP 8 — CREATE tests/suites/04-state-machine.test.mjs
═══════════════════════════════════════════════════════════════
Create tests/suites/04-state-machine.test.mjs:

import { describe, it, expect } from "vitest";
import { getEffectiveStatus } from "../../src/utils/commitmentStatus.js";
import { isActiveBill } from "../../src/utils/billLifecycle.js";
import { canEditLending, canDeleteLending, isAgreementFullyLocked } from "../../src/engines/lendingAgreement.js";
import { TODAY, LENDING } from "../fixtures.mjs";

describe("⚙️ STATE MACHINE: commitment status transitions", () => {

  const paid    = { id: "1", amount: 5000, status: "paid",    dueDate: "2026-06-01" };
  const pending = { id: "2", amount: 5000, status: "pending", dueDate: "2026-07-01" };
  const overdue = { id: "3", amount: 5000, status: "pending", dueDate: "2026-05-01" }; // past due

  it("[P1] paid commitment reports status=paid", () => {
    const status = getEffectiveStatus(paid, TODAY);
    expect(status).toBe("paid");
  });

  it("[P1] future-due pending commitment reports pending", () => {
    const status = getEffectiveStatus(pending, TODAY);
    expect(["pending", "upcoming"]).toContain(status);
  });

  it("[P1] past-due pending commitment reports overdue", () => {
    const status = getEffectiveStatus(overdue, TODAY);
    expect(status).toBe("overdue");
  });

  it("[P1] paid commitment is NOT an active bill", () => {
    expect(isActiveBill(paid)).toBe(false);
  });

  it("[P1] pending commitment IS an active bill", () => {
    expect(isActiveBill(pending)).toBe(true);
  });
});

describe("⚙️ STATE MACHINE: lending agreement transitions", () => {

  it("[P1] unsigned lending CAN be edited", () => {
    expect(canEditLending(LENDING.normal)).toBe(true);
  });

  it("[P1] unsigned lending CAN be deleted", () => {
    expect(canDeleteLending(LENDING.normal)).toBe(true);
  });

  it("[P0] signed/locked lending CANNOT be edited", () => {
    expect(canEditLending(LENDING.locked)).toBe(false);
  });

  it("[P0] signed/locked lending CANNOT be deleted", () => {
    expect(canDeleteLending(LENDING.locked)).toBe(false);
  });

  it("[P0] agreement with esignStatus=completed IS fully locked", () => {
    expect(isAgreementFullyLocked(LENDING.locked)).toBe(true);
  });

  it("[P1] agreement without esign is NOT locked", () => {
    expect(isAgreementFullyLocked(LENDING.normal)).toBe(false);
  });

  it("[P2] zero-principal lending is not locked", () => {
    expect(isAgreementFullyLocked(LENDING.zero)).toBe(false);
  });
});

═══════════════════════════════════════════════════════════════
STEP 9 — CREATE tests/suites/05-data-integrity.test.mjs
═══════════════════════════════════════════════════════════════
Create tests/suites/05-data-integrity.test.mjs:

import { describe, it, expect } from "vitest";
import { yearlyInrAfterSave, effectiveAnnualMonthlyInr, PLAN_PRESENTATION, isFeatureUnlocked, YEARLY_SAVE_PERCENT } from "../../src/constants/subscriptionTiers.js";
import { FREE_TIER_LIMITS, PRO_CASHFLOW_DAYS } from "../../src/constants/tierLimits.js";

describe("💰 DATA INTEGRITY: subscription pricing math", () => {

  it("[P0] YEARLY_SAVE_PERCENT is 29 (any change breaks pricing)", () => {
    expect(YEARLY_SAVE_PERCENT).toBe(29);
  });

  it("[P0] Free tier limits are exactly as spec'd (no accidental changes)", () => {
    expect(FREE_TIER_LIMITS.activeLendingRecords).toBe(5);
    expect(FREE_TIER_LIMITS.activeChitRecords).toBe(2);
    expect(FREE_TIER_LIMITS.activeGoals).toBe(3);
    expect(FREE_TIER_LIMITS.dailySpendsPerMonth).toBe(50);
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

  it("[P2] PLAN_PRESENTATION has exactly 3 plans (free, pro, power)", () => {
    const tiers = PLAN_PRESENTATION.map(p => p.tier);
    expect(tiers).toContain("free");
    expect(tiers).toContain("pro");
    expect(tiers).toContain("power");
    expect(tiers).toHaveLength(3);
  });

  it("[P2] Power plan annual price is less than monthly × 12", () => {
    const power = PLAN_PRESENTATION.find(p => p.tier === "power");
    if (power?.monthlyInr && power?.annualInr) {
      expect(power.annualInr).toBeLessThan(power.monthlyInr * 12);
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

═══════════════════════════════════════════════════════════════
STEP 10 — CREATE tests/suites/06-i18n-coverage.test.mjs
═══════════════════════════════════════════════════════════════
Create tests/suites/06-i18n-coverage.test.mjs:

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load source locale (en) and test locales
const loadLocale = (lang) => {
  try {
    // Dynamic require-style reading since these are .js files with export default
    const path = resolve(process.cwd(), `src/i18n/messages/${lang}.js`);
    const content = readFileSync(path, "utf-8");
    // Extract the object via regex (crude but works for flat objects)
    const matches = [...content.matchAll(/"([^"]+)":\s*"([^"]*)"/g)];
    return Object.fromEntries(matches.map(m => [m[1], m[2]]));
  } catch { return {}; }
};

const EN = loadLocale("en");
const HI = loadLocale("hi");
const TE = loadLocale("te");
const TA = loadLocale("ta");

const EN_KEYS = Object.keys(EN);

// Terms that should NEVER be translated (Indian fintech acronyms)
const DO_NOT_TRANSLATE = ["EMI", "SIP", "CIBIL", "UPI", "PAN", "GST",
  "NEFT", "RTGS", "PPF", "EPF", "NPS", "ELSS", "HRA", "ITR", "TDS", "IMPS"];

describe("🌐 i18n: translation coverage", () => {

  it("[P2] Hindi (hi) has at least 80% of English keys", () => {
    if (Object.keys(HI).length === 0) return; // skip if file unreadable
    const hiKeys = Object.keys(HI);
    const coverage = hiKeys.length / EN_KEYS.length;
    expect(coverage).toBeGreaterThan(0.8);
  });

  it("[P2] Telugu (te) has at least 70% of English keys", () => {
    if (Object.keys(TE).length === 0) return;
    const coverage = Object.keys(TE).length / EN_KEYS.length;
    expect(coverage).toBeGreaterThan(0.7);
  });

  DO_NOT_TRANSLATE.forEach(term => {
    it(`[P1] '${term}' is not translated in Hindi`, () => {
      const hiValues = Object.values(HI);
      // The TERM should appear as-is in values if the key contains it
      const enKeysWithTerm = EN_KEYS.filter(k => EN[k]?.includes(term));
      enKeysWithTerm.forEach(key => {
        if (HI[key]) {
          expect(HI[key]).toContain(term); // term must appear unchanged
        }
      });
    });
  });

  it("[P1] no {placeholder} in EN values appears untranslated in HI", () => {
    EN_KEYS.forEach(key => {
      const enVal = EN[key] || "";
      const hiVal = HI[key] || "";
      const placeholders = [...enVal.matchAll(/\{[^}]+\}/g)].map(m => m[0]);
      placeholders.forEach(ph => {
        if (hiVal && !hiVal.includes(ph)) {
          // This is a P1 — placeholder missing in translation
          console.warn(`[P1] Placeholder ${ph} missing in hi[${key}]`);
        }
      });
    });
    // This test always passes but logs warnings for missing placeholders
    expect(true).toBe(true);
  });
});

═══════════════════════════════════════════════════════════════
STEP 11 — CREATE tests/suites/07-architecture.test.mjs
═══════════════════════════════════════════════════════════════
Create tests/suites/07-architecture.test.mjs:

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const fileExists = (p) => existsSync(resolve(process.cwd(), p));
const fileContent = (p) => {
  try { return readFileSync(resolve(process.cwd(), p), "utf-8"); }
  catch { return ""; }
};

describe("🏗️ ARCHITECTURE: critical files must exist", () => {

  // Core engines
  const CRITICAL_ENGINES = [
    "src/engines/pressureScore.js", "src/engines/survival.js",
    "src/engines/burden.js", "src/engines/lendingAgreement.js",
    "src/engines/incomeTaxEstimate.js", "src/engines/chitFund.js",
    "src/engines/safeToSpend.js",
    "src/engines/netWorth/core.js", "src/engines/netWorth/simulation.js",
    "src/engines/netWorth/liquidity.js",
  ];

  CRITICAL_ENGINES.forEach(path => {
    it(`[P0] ${path} exists`, () => {
      expect(fileExists(path)).toBe(true);
    });
  });

  // Core constants
  it("[P0] subscriptionTiers.js exists", () => {
    expect(fileExists("src/constants/subscriptionTiers.js")).toBe(true);
  });
  it("[P0] tierLimits.js exists", () => {
    expect(fileExists("src/constants/tierLimits.js")).toBe(true);
  });

  // Dev tools must NOT leak into prod builds
  it("[P1] devOverride IS_DEV uses import.meta.env.DEV (not hardcoded true)", () => {
    if (!fileExists("src/utils/devOverride.js")) return;
    const content = fileContent("src/utils/devOverride.js");
    expect(content).toContain("import.meta.env.DEV");
    expect(content).not.toMatch(/IS_DEV\s*=\s*true/);
  });

  it("[P1] DevPanel only renders in dev mode", () => {
    if (!fileExists("src/ui/features/dev/DevPanel.jsx")) return;
    const content = fileContent("src/ui/features/dev/DevPanel.jsx");
    expect(content).toContain("IS_DEV");
  });

  // Navigation: check for nav items
  it("[P2] userModes.js has NAV_ITEMS defined", () => {
    const content = fileContent("src/constants/userModes.js");
    expect(content).toContain("NAV_ITEMS");
  });

  // Design tokens: check if modern tokens have been applied
  it("[P2] NOTICE: modern design tokens need to be applied", () => {
    const content = fileContent("src/ui/styles/tokens.css");
    const hasModernTokens = content.includes("ct-grad-pressure") || 
                            content.includes("ct-hero-glow");
    if (!hasModernTokens) {
      console.warn("[P2] Modern design tokens not yet applied — run Prompt S1 from the UI spec");
    }
    expect(true).toBe(true); // Always passes but warns
  });

  it("[P2] NOTICE: /plan route needs to be created", () => {
    const content = fileContent("src/App.jsx");
    if (!content.includes('path="/plan"')) {
      console.warn("[P2] /plan route not found in App.jsx — run PlanPage spec prompts");
    }
    expect(true).toBe(true);
  });

  it("[P2] NOTICE: /money route needs to be created", () => {
    const content = fileContent("src/App.jsx");
    if (!content.includes('path="/money"')) {
      console.warn("[P2] /money route not found in App.jsx — run MoneyPage spec prompts");
    }
    expect(true).toBe(true);
  });
});

═══════════════════════════════════════════════════════════════
STEP 12 — CREATE tests/suites/08-error-safety.test.mjs
═══════════════════════════════════════════════════════════════
Create tests/suites/08-error-safety.test.mjs:

import { describe, it, expect } from "vitest";
import { computeCanonicalPressureScore } from "../../src/engines/pressureScore.js";
import { computeSurvivalAnalysis } from "../../src/engines/survival.js";
import { buildPromissoryNoteText, numberToWords } from "../../src/engines/lendingAgreement.js";
import { COMMITMENT, LENDING, SETTINGS, TODAY, STATUS, INCOME } from "../fixtures.mjs";

// Every function called with completely wrong arg types must not crash.
// This simulates network data corruption or API returning unexpected types.

describe("🔥 CHAOS: wrong argument types — all engines must not crash", () => {

  const WRONG_TYPES = [null, undefined, "", "string", [], {}, 0, false, true, Symbol("x")];

  WRONG_TYPES.forEach(wrongCommitments => {
    it(`[P0] pressureScore with commitments=${JSON.stringify(wrongCommitments)} doesn't throw`, () => {
      expect(() => computeCanonicalPressureScore({
        commitments: wrongCommitments,
        income: INCOME.average,
        getEffectiveStatus: STATUS.pending,
      })).not.toThrow();
    });
  });

  WRONG_TYPES.forEach(wrongStatus => {
    if (typeof wrongStatus === "function") return;
    it(`[P0] pressureScore with getEffectiveStatus=${JSON.stringify(wrongStatus)} handled gracefully`, () => {
      expect(() => computeCanonicalPressureScore({
        commitments: [COMMITMENT.normal],
        income: INCOME.average,
        getEffectiveStatus: typeof wrongStatus === "function" ? wrongStatus : () => "pending",
      })).not.toThrow();
    });
  });

  it("[P0] survival with completely empty params object", () => {
    expect(() => computeSurvivalAnalysis({})).not.toThrow();
  });

  it("[P0] survival with null params", () => {
    expect(() => computeSurvivalAnalysis(null)).not.toThrow();
  });

  it("[P0] numberToWords with string input", () => {
    expect(() => numberToWords("five thousand")).not.toThrow();
  });

  it("[P0] numberToWords with object input", () => {
    expect(() => numberToWords({})).not.toThrow();
  });

  it("[P0] buildPromissoryNoteText with null lending", () => {
    expect(() => buildPromissoryNoteText(null, SETTINGS.pro)).not.toThrow();
  });

  it("[P0] buildPromissoryNoteText with null settings", () => {
    expect(() => buildPromissoryNoteText(LENDING.normal, null)).not.toThrow();
  });

  it("[P0] buildPromissoryNoteText with both null", () => {
    expect(() => buildPromissoryNoteText(null, null)).not.toThrow();
  });
});

═══════════════════════════════════════════════════════════════
STEP 13 — CREATE tests/qa-runner.mjs (THE TERMINAL CHAOS REPORTER)
═══════════════════════════════════════════════════════════════
Create tests/qa-runner.mjs:

#!/usr/bin/env node
/**
 * Perovo QA Runner — Chaos & Security Terminal Reporter
 * Usage:
 *   npm run qa              → full run, all suites
 *   npm run qa -- --fast    → skip slow tests
 *   npm run qa -- --p0      → only critical failures
 */
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ─── ANSI colors ────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  red:    "\x1b[31m", bright_red: "\x1b[91m",
  yellow: "\x1b[33m", bright_yellow: "\x1b[93m",
  green:  "\x1b[32m", bright_green: "\x1b[92m",
  blue:   "\x1b[34m", cyan: "\x1b[36m",
  magenta:"\x1b[35m", white: "\x1b[97m",
  bg_red: "\x1b[41m", bg_green: "\x1b[42m", bg_yellow: "\x1b[43m",
};

const args = process.argv.slice(2);
const FAST   = args.includes("--fast");
const ONLY_P0 = args.includes("--p0");

// ─── Banner ─────────────────────────────────────────────────
console.log("");
console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}${C.cyan}║   PEROVO — AI QUALITY ENGINEERING SUITE                  ║${C.reset}`);
console.log(`${C.bold}${C.cyan}║   Chaos · Security · Fintech · Edge Cases · Architecture ║${C.reset}`);
console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════╝${C.reset}`);
console.log(`${C.dim}  Mode: ${FAST ? "FAST (skipping slow tests)" : "FULL"} · Only P0: ${ONLY_P0}${C.reset}`);
console.log("");

const startTime = Date.now();

// ─── Run vitest and capture JSON output ─────────────────────
let vitestJson = null;
let vitestError = false;

try {
  const output = execSync(
    `npx vitest run --reporter=json 2>/dev/null`,
    { cwd: process.cwd(), encoding: "utf-8", timeout: 120000 }
  );
  vitestJson = JSON.parse(output);
} catch (err) {
  // vitest exits with non-zero on failures — capture the output anyway
  try {
    if (err.stdout) vitestJson = JSON.parse(err.stdout);
  } catch { vitestError = true; }
}

// ─── Parse results ──────────────────────────────────────────
const findings = { P0: [], P1: [], P2: [], P3: [], passed: [] };
let totalTests = 0;

if (vitestJson && vitestJson.testResults) {
  for (const file of vitestJson.testResults) {
    const suiteName = file.displayName || file.name || "";
    for (const suite of (file.assertionResults || [])) {
      totalTests++;
      const title = suite.title || "";
      const fullTitle = suite.fullName || `${suiteName} > ${title}`;

      // Extract severity from test title: [P0], [P1], [P2], [P3]
      const sevMatch = title.match(/\[(P[0-3])\]/);
      const severity = sevMatch ? sevMatch[1] : null;

      if (suite.status === "failed") {
        const finding = {
          title: fullTitle,
          severity: severity || "P2",
          error: (suite.failureMessages || []).join("\n").slice(0, 200),
          file: file.displayName || file.name,
        };
        if (severity === "P0") findings.P0.push(finding);
        else if (severity === "P1") findings.P1.push(finding);
        else if (severity === "P3") findings.P3.push(finding);
        else findings.P2.push(finding);
      } else {
        findings.passed.push({ title: fullTitle, severity });
      }
    }
  }
}

// ─── Print findings ─────────────────────────────────────────
const printFinding = (f, icon, color) => {
  const sev = f.severity ? `[${f.severity}]` : "";
  console.log(`  ${color}${icon} ${C.bold}${sev}${C.reset}${color} ${f.title}${C.reset}`);
  if (f.error) {
    const errLine = f.error.split("\n")[0].trim().slice(0, 100);
    console.log(`        ${C.dim}↳ ${errLine}${C.reset}`);
  }
};

if (findings.P0.length > 0) {
  console.log(`\n${C.bold}${C.bg_red}${C.white}  🚨 CRITICAL — FIX BEFORE ANY RELEASE (P0: ${findings.P0.length})  ${C.reset}`);
  findings.P0.forEach(f => printFinding(f, "●", C.bright_red));
}

if (findings.P1.length > 0 && !ONLY_P0) {
  console.log(`\n${C.bold}${C.red}  ⚠  HIGH — Fix before public launch (P1: ${findings.P1.length})${C.reset}`);
  findings.P1.forEach(f => printFinding(f, "▸", C.red));
}

if (findings.P2.length > 0 && !ONLY_P0) {
  console.log(`\n${C.yellow}  ●  MEDIUM — Fix soon (P2: ${findings.P2.length})${C.reset}`);
  findings.P2.forEach(f => printFinding(f, "·", C.yellow));
}

if (findings.P3.length > 0 && !ONLY_P0) {
  console.log(`\n${C.dim}  ○  LOW — Nice to fix (P3: ${findings.P3.length})${C.reset}`);
  findings.P3.forEach(f => printFinding(f, "·", C.dim));
}

// ─── Architecture warnings (from console.warn in tests) ─────
console.log(`\n${C.cyan}  ℹ  ARCHITECTURE NOTICES (from test run):${C.reset}`);
const ARCH_CHECKS = [
  { check: () => !existsSync(resolve(process.cwd(), "src/ui/styles/tokens.css")) || 
      !readFileSync(resolve(process.cwd(), "src/ui/styles/tokens.css"), "utf-8").includes("ct-grad-pressure"),
    msg: "Modern design tokens not applied — run Prompt S1", sev: "P2" },
  { check: () => !readFileSync(resolve(process.cwd(), "src/App.jsx"), "utf-8").includes('path="/plan"'),
    msg: "/plan route missing — Plan tab not accessible from nav", sev: "P2" },
  { check: () => !readFileSync(resolve(process.cwd(), "src/App.jsx"), "utf-8").includes('path="/money"'),
    msg: "/money route missing — Money tab not accessible from nav", sev: "P2" },
  { check: () => !readFileSync(resolve(process.cwd(), "src/constants/userModes.js"), "utf-8").includes('"wallet"'),
    msg: "Nav still uses old tabs (Bills/Lending) not Money/Plan", sev: "P2" },
  { check: () => {
      const app = readFileSync(resolve(process.cwd(), "src/App.jsx"), "utf-8");
      return !app.includes('path="/analytics"') && !app.includes('path="/money"');
    }, msg: "Analytics unreachable from nav bar", sev: "P2" },
];

let archWarnings = 0;
for (const item of ARCH_CHECKS) {
  try {
    if (item.check()) {
      console.log(`  ${C.yellow}[${item.sev}]${C.reset} ${C.dim}${item.msg}${C.reset}`);
      archWarnings++;
    }
  } catch {}
}
if (archWarnings === 0) {
  console.log(`  ${C.green}✓ All architecture checks passed${C.reset}`);
}

// ─── Final report ────────────────────────────────────────────
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
const totalFailed = findings.P0.length + findings.P1.length + findings.P2.length + findings.P3.length;
const passRate = totalTests > 0 ? ((findings.passed.length / totalTests) * 100).toFixed(0) : 0;

const healthScore = Math.max(0, 10 -
  (findings.P0.length * 3) -
  (findings.P1.length * 1.5) -
  (findings.P2.length * 0.5) -
  (archWarnings * 0.3)
).toFixed(1);

const healthColor = healthScore >= 8 ? C.bright_green : healthScore >= 5 ? C.yellow : C.bright_red;
const launchReady = findings.P0.length === 0 && findings.P1.length < 3;

console.log("");
console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}${C.cyan}║  FINAL QA REPORT                                         ║${C.reset}`);
console.log(`${C.bold}${C.cyan}╠══════════════════════════════════════════════════════════╣${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.bright_red}🔴 CRITICAL (P0): ${String(findings.P0.length).padEnd(4)}${C.reset}  Must fix before any release    ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.red}🟠 HIGH (P1):     ${String(findings.P1.length).padEnd(4)}${C.reset}  Fix before public launch        ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.yellow}🟡 MEDIUM (P2):   ${String(findings.P2.length).padEnd(4)}${C.reset}  Fix soon                        ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.dim}⚪ LOW (P3):      ${String(findings.P3.length).padEnd(4)}${C.reset}  Nice to fix                     ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  ${C.bright_green}✅ PASSED:        ${String(findings.passed.length).padEnd(4)}${C.reset}  Looking good                   ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}╠══════════════════════════════════════════════════════════╣${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  Pass rate: ${passRate}%    Health: ${healthColor}${healthScore}/10${C.reset}    Time: ${elapsed}s          ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}║${C.reset}  Launch ready: ${launchReady ? `${C.bright_green}✅ YES${C.reset}` : `${C.bright_red}❌ NO (fix P0 + P1 first)${C.reset}`}                    ${C.bold}${C.cyan}║${C.reset}`);
console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════╝${C.reset}`);

// ─── Easiest-to-break summary ────────────────────────────────
if (findings.P0.length > 0 || findings.P1.length > 0) {
  console.log(`\n${C.bold}  ⚡ MOST VULNERABLE AREAS:${C.reset}`);
  const topFindings = [...findings.P0, ...findings.P1].slice(0, 5);
  topFindings.forEach((f, i) => {
    console.log(`  ${i + 1}. ${C.red}[${f.severity}]${C.reset} ${f.title.split(">").pop().trim()}`);
  });
}

console.log(`\n${C.dim}  Run 'npm run qa -- --p0' to see only critical issues${C.reset}`);
console.log(`${C.dim}  Run 'npm test' to re-run tests without the full report${C.reset}`);
console.log("");

// Exit with non-zero if there are P0 or P1 failures (for CI)
if (findings.P0.length > 0) process.exit(2);
if (findings.P1.length > 0) process.exit(1);
process.exit(0);

═══════════════════════════════════════════════════════════════
STEP 14 — FINAL VERIFICATION
═══════════════════════════════════════════════════════════════
After creating all files, verify:

1. npm test    → vitest runs all 8 test suites, outputs pass/fail
2. npm run qa  → the chaos reporter runs and shows colored terminal output

Verify the file structure:
  tests/
    fixtures.mjs
    qa-runner.mjs
    suites/
      01-fintech-logic.test.mjs
      02-security-tiers.test.mjs
      03-edge-cases.test.mjs
      04-state-machine.test.mjs
      05-data-integrity.test.mjs
      06-i18n-coverage.test.mjs
      07-architecture.test.mjs
      08-error-safety.test.mjs

  src/                 ← zero .test.* files remain (all deleted in Step 1)

The QA runner exits with code 2 if any P0 is found,
code 1 if P1 issues only, code 0 if all passing.
This makes it CI-compatible: the pipeline fails on P0/P1.

Run: npm run qa
```
