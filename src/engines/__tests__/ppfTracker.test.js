import { describe, it, expect } from "vitest";
import { computePpfProjection } from "../ppfTracker.js";

describe("ppfTracker", () => {
  it("projects corpus with annual deposits", () => {
    const r = computePpfProjection({ annualContribution: 150_000, currentCorpus: 100_000, yearsRemaining: 10 });
    expect(r.projectedCorpus).toBeGreaterThan(r.currentCorpus + 1_000_000);
    expect(r.annualContribution).toBe(150_000);
  });
});
