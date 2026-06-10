import { describe, expect, it } from "vitest";
import { analyzeInsuranceWorth } from "../insuranceCalculator.js";

describe("analyzeInsuranceWorth", () => {
  it("returns verdict for high premium share", () => {
    const r = analyzeInsuranceWorth({
      premiumAmount: 15000,
      premiumFrequency: "yearly",
      sumAssured: 500000,
      monthlyIncome: 50000,
    });
    expect(r.verdict).toBeTruthy();
    expect(r.premiumShareOfIncome).toBeGreaterThan(0);
  });
});
