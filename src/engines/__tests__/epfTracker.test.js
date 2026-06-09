import { describe, it, expect } from "vitest";
import { computeEpfProjection, estimateBasicFromGross } from "../epfTracker.js";

describe("epfTracker", () => {
  it("projects corpus growth with contributions", () => {
    const result = computeEpfProjection({
      monthlyBasicSalary: 50_000,
      currentCorpus: 200_000,
      age: 30,
      retirementAge: 60,
    });
    expect(result.monthlyTotal).toBeGreaterThan(0);
    expect(result.projectedCorpusAtRetirement).toBeGreaterThan(result.currentCorpus);
    expect(result.narrativeLines.length).toBeGreaterThan(0);
  });

  it("estimates basic from gross", () => {
    expect(estimateBasicFromGross(100_000)).toBe(40_000);
  });
});
