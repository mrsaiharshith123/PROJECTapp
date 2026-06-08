import { describe, expect, it } from "vitest";
import {
  computeOverallMonthlySpend,
  salarySpendBarColor,
  spendPctOfSalary,
} from "../salarySpendBar.js";

describe("salarySpendBar", () => {
  it("sums recurring payments and variable spend", () => {
    expect(computeOverallMonthlySpend(12000, 3500)).toBe(15500);
  });

  it("computes share of salary", () => {
    expect(spendPctOfSalary(50000, 100000)).toBe(50);
  });

  it("shifts hue from green toward red", () => {
    expect(salarySpendBarColor(10)).toMatch(/hsl\(12\d/);
    expect(salarySpendBarColor(90)).toMatch(/hsl\(1\d/);
    expect(salarySpendBarColor(100)).toBe("#ef4444");
  });
});
