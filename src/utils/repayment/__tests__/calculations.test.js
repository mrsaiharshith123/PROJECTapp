import { describe, it, expect } from "vitest";
import { calculateMonthlyEMI, calculateSimpleInterest } from "../calculations.js";
import { computeLoanEmi } from "../../loanEmi.js";

describe("calculateMonthlyEMI — exact-value regression", () => {
  it("matches the textbook amortization formula for a standard home-loan example", () => {
    // ₹5,00,000 at 8.5% annual for 60 months — hand-calculated via
    // M = P·r(1+r)^n / ((1+r)^n − 1), r = 0.085/12.
    const emi = calculateMonthlyEMI(500000, 8.5, 60);
    expect(emi).toBeCloseTo(10258.7, 0);
  });

  it("matches a second known figure — ₹20,00,000 at 9% for 240 months", () => {
    const emi = calculateMonthlyEMI(2000000, 9, 240);
    expect(emi).toBeCloseTo(17994.9, 0);
  });

  it("returns exact equal split for zero-interest loans", () => {
    expect(calculateMonthlyEMI(120000, 0, 12)).toBe(10000);
  });

  it("computeLoanEmi (utils/loanEmi.js) stays in lockstep with the canonical formula", () => {
    // Regression guard: this is the exact bug class the app previously shipped —
    // two EMI implementations silently drifting apart. computeLoanEmi must always
    // equal Math.round(calculateMonthlyEMI(...)).
    const principal = 750000;
    const rate = 11.25;
    const tenure = 84;
    expect(computeLoanEmi(principal, rate, tenure)).toBe(
      Math.round(calculateMonthlyEMI(principal, rate, tenure))
    );
  });
});

describe("calculateSimpleInterest — exact-value regression", () => {
  it("computes I = P*r*t for a known figure", () => {
    // ₹1,00,000 at 12% for 18 months = 100000 * 0.12 * 1.5 = 18000
    expect(calculateSimpleInterest(100000, 12, 18)).toBeCloseTo(18000, 2);
  });
});
