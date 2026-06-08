import { describe, expect, it } from "vitest";
import { buildStabilityHealthNarrative } from "../stabilityNarrative.js";

describe("buildStabilityHealthNarrative", () => {
  it("returns strengths and weaknesses arrays", () => {
    const r = buildStabilityHealthNarrative({
      health: { level: "good" },
      stability: { score: 40, committedPercent: 50 },
      survival: { tier: "healthy", survivalMonths: 8 },
      lifestyle: { growthPercent: 10 },
      overdueCount: 0,
      commitments: [],
      lendings: [],
    });
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.weaknesses)).toBe(true);
  });

  it("returns i18n keys for headline and label", () => {
    const r = buildStabilityHealthNarrative({
      health: { level: "caution" },
      stability: { score: 70, committedPercent: 70 },
      survival: { tier: "weak", survivalMonths: 2 },
      lifestyle: { growthPercent: 30 },
      overdueCount: 2,
    });
    expect(r.headlineKey).toBeTruthy();
    expect(r.stabilityLabelKey).toBeTruthy();
    for (const s of [...r.strengths, ...r.weaknesses]) {
      expect(s.key).toBeTruthy();
    }
  });

  it("does not throw on empty input object", () => {
    expect(() => buildStabilityHealthNarrative({})).not.toThrow();
  });

  it("does not throw when optional fields are null", () => {
    expect(() =>
      buildStabilityHealthNarrative({
        health: null,
        stability: null,
        survival: null,
        emergency: null,
        lifestyle: null,
        commitments: null,
        lendings: null,
      }),
    ).not.toThrow();
  });

  it("flags overdue bills in weaknesses", () => {
    const r = buildStabilityHealthNarrative({ overdueCount: 2 });
    expect(r.weaknesses.some((w) => w.key === "narrative.weakness.overdueMany")).toBe(true);
  });
});
