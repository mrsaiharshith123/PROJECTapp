import { describe, it, expect } from "vitest";
import { recommendSipStepUp } from "../sipAdvisor.js";

describe("recommendSipStepUp", () => {
  it("recommends a step-up when income grew meaningfully and the SIP has been unchanged a while", () => {
    const result = recommendSipStepUp({
      currentMonthlySip: 5000,
      currentIncome: 94400,
      priorIncome: 80000,
      monthsSinceLastChange: 14,
      remainingYears: 20,
    });
    expect(result.eligible).toBe(true);
    expect(result.incomeGrowthPct).toBe(18);
    expect(result.suggestedSip).toBeGreaterThan(5000);
    expect(result.additionalCorpus).toBeGreaterThan(0);
  });

  it("does not recommend a step-up when income hasn't grown enough", () => {
    const result = recommendSipStepUp({
      currentMonthlySip: 5000,
      currentIncome: 82000,
      priorIncome: 80000,
      monthsSinceLastChange: 14,
      remainingYears: 20,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("income_flat");
  });

  it("does not recommend a step-up right after a recent change even with income growth", () => {
    const result = recommendSipStepUp({
      currentMonthlySip: 5000,
      currentIncome: 94400,
      priorIncome: 80000,
      monthsSinceLastChange: 2,
      remainingYears: 20,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("recently_changed");
  });

  it("returns ineligible without crashing when there's no prior SIP data", () => {
    const result = recommendSipStepUp({ currentMonthlySip: 0, currentIncome: 90000, priorIncome: 0, monthsSinceLastChange: 20, remainingYears: 10 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("insufficient_data");
  });
});
