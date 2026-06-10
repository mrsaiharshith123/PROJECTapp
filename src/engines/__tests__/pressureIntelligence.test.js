import { describe, expect, it } from "vitest";
import { buildPressureIntelligence } from "../pressureIntelligence.js";

describe("buildPressureIntelligence", () => {
  it("returns hint key for score band", () => {
    const r = buildPressureIntelligence({
      snapshots: [{ month: "2026-05", pressure: 40, openRemainingSum: 1000 }],
      commitments: [],
      todayStr: "2026-06-10",
      score: 55,
      stressTop: [{ name: "Rent", weight: 15000 }],
    });
    expect(r.emotionalHintKey).toBeTruthy();
    expect(r.sources.length).toBeGreaterThan(0);
  });
});
