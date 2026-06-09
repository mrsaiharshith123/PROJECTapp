import { describe, it, expect } from "vitest";
import {
  survivalTierFromMonths,
  survivalTierTone,
  computeSurvivalAnalysis,
  lendingMonthlyOutflow,
  buildSurvivalContext,
} from "../survival.js";

describe("survivalTierFromMonths", () => {
  it("maps months to tiers", () => {
    expect(survivalTierFromMonths(1).tier).toBe("critical");
    expect(survivalTierFromMonths(3).tier).toBe("weak");
    expect(survivalTierFromMonths(5).tier).toBe("moderate");
    expect(survivalTierFromMonths(8).tier).toBe("healthy");
    expect(survivalTierFromMonths(14).tier).toBe("strong");
  });
});

describe("survivalTierTone", () => {
  it("returns semantic tokens not CSS", () => {
    expect(survivalTierTone("strong")).toBe("success");
    expect(survivalTierTone("critical")).toBe("danger");
    expect(survivalTierTone("strong")).not.toMatch(/bg-/);
  });
});

describe("computeSurvivalAnalysis", () => {
  it("computes survival months from liquid + free over burn", () => {
    const r = computeSurvivalAnalysis({
      income: 100000,
      freeMoney: 20000,
      liquidSavings: 80000,
      monthlyBurden: 25000,
      lendingOutflow: 0,
      todayStr: "2026-06-01",
    });
    expect(r.survivalMonths).toBe(4);
    expect(r.tier).toBe("moderate");
    expect(r.tone).toBe("warning");
    expect(r.scenarios?.baseline).toBeDefined();
    expect(r.scenarios?.stressed).toBeDefined();
    expect(r.scenarios?.critical).toBeDefined();
  });

  it("returns multi-scenario narratives", () => {
    const r = computeSurvivalAnalysis({
      income: 50000,
      freeMoney: 5000,
      liquidSavings: 10000,
      monthlyBurden: 30000,
      todayStr: "2026-06-01",
    });
    expect(r.classification).toBeTruthy();
    expect(r.narrativeLines.length).toBeGreaterThan(0);
  });
});

describe("lendingMonthlyOutflow", () => {
  it("sums next due on borrowed lendings", () => {
    const out = lendingMonthlyOutflow(
      [
        {
          type: "borrowed",
          remainingAmount: 120000,
          repaymentSchedule: [{ paymentStatus: "pending", totalPayment: 10000 }],
        },
      ],
      () => "active",
      "2026-05-15",
    );
    expect(out).toBe(10000);
  });
});

describe("survival edge cases", () => {
  it("survivalMonths is 0 when emergency fund and free cash are 0", () => {
    const r = computeSurvivalAnalysis({
      income: 50000,
      freeMoney: 0,
      liquidSavings: 0,
      monthlyBurden: 25000,
    });
    expect(r.survivalMonths).toBe(0);
  });

  it("does not throw when commitments array is empty in buildSurvivalContext", () => {
    expect(() =>
      buildSurvivalContext([], [], { monthlyIncome: 50000, liquidSavings: 0 }, () => "pending", () => "active", "2026-06-05"),
    ).not.toThrow();
  });
});
