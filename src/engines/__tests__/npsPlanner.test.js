import { describe, it, expect } from "vitest";
import { computeNpsProjection, computeRetirementMix } from "../npsPlanner.js";

describe("npsPlanner", () => {
  it("projects NPS corpus", () => {
    const r = computeNpsProjection({ monthlyEmployee: 5000, monthlyEmployer: 5000, age: 30 });
    expect(r.projectedCorpusAtRetirement).toBeGreaterThan(0);
    expect(r.deduction80ccd1b).toBeGreaterThan(0);
  });

  it("blends retirement pillars", () => {
    const mix = computeRetirementMix({ epf: 1_000_000, ppf: 500_000, nps: 500_000 });
    expect(mix.total).toBe(2_000_000);
    expect(mix.shares).toHaveLength(3);
  });
});
