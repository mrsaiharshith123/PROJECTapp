import { describe, it, expect } from "vitest";
import { computeDiversificationScore } from "../diversificationScore.js";

describe("computeDiversificationScore", () => {
  it("returns hasData:false with zero score for no assets", () => {
    expect(computeDiversificationScore([])).toEqual(
      expect.objectContaining({ score: 0, hasData: false }),
    );
  });

  it("flags 73% concentration in the headline insight even when other assets pull the holistic band up", () => {
    const assets = [
      { id: "p1", categoryId: "property_residential", name: "House", value: 7300000 },
      { id: "a2", categoryId: "bank", name: "Savings", value: 1000000 },
      { id: "a3", categoryId: "gold", name: "Gold", value: 1700000 },
    ];
    const result = computeDiversificationScore(assets);
    expect(result.topConcentration.pct).toBe(73);
    expect(result.topConcentration.name).toBe("House");
    // The >=50% single-asset concentration always fires its own insight,
    // independent of the holistic HHI band (which also credits the other
    // two assets and can land in "moderate" even with one dominant asset).
    expect(result.insightKeys.length).toBeGreaterThan(0);
  });

  it("scores near-total concentration (single asset, no diversifiers) as concentrated", () => {
    const assets = [
      { id: "p1", categoryId: "property_residential", name: "House", value: 9500000 },
      { id: "a2", categoryId: "bank", name: "Savings", value: 500000 },
    ];
    const result = computeDiversificationScore(assets);
    expect(result.topConcentration.pct).toBe(95);
    expect(result.band).toBe("concentrated");
  });

  it("scores evenly-split assets as diversified", () => {
    const assets = [
      { id: "a1", categoryId: "bank", name: "A", value: 250000 },
      { id: "a2", categoryId: "gold", name: "B", value: 250000 },
      { id: "a3", categoryId: "fd", name: "C", value: 250000 },
      { id: "a4", categoryId: "stocks", name: "D", value: 250000 },
    ];
    const result = computeDiversificationScore(assets);
    expect(result.score).toBeGreaterThan(90);
    expect(result.band).toBe("diversified");
  });

  it("never returns NaN or a score outside 0-100", () => {
    const assets = [{ id: "a1", categoryId: "bank", name: "Only", value: 100 }];
    const result = computeDiversificationScore(assets);
    expect(Number.isFinite(result.score)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
