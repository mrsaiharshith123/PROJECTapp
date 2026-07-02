import { describe, it, expect } from "vitest";
import * as engine from "../commitmentInsights.js";

describe("commitmentInsights", () => {
  it("exports insight helpers", () => {
    expect(typeof engine.generateCommitmentInsights).toBe("function");
    expect(typeof engine.mergeExtendedInsights).toBe("function");
    expect(typeof engine.overlappingDueDatesInsight).toBe("function");
  });

  it("generateCommitmentInsights returns array for empty ctx", () => {
    const insights = engine.generateCommitmentInsights({
      commitments: [],
      snapshots: [],
      income: 50000,
      getEffectiveStatus: () => "active",
    });
    expect(Array.isArray(insights)).toBe(true);
  });

  it("mergeExtendedInsights dedupes by id", () => {
    const merged = engine.mergeExtendedInsights(
      [{ id: "a", tone: "info" }],
      [{ id: "a", tone: "warning" }, { id: "b", tone: "info" }],
    );
    expect(merged).toHaveLength(2);
    expect(merged.map((i) => i.id)).toEqual(["a", "b"]);
  });
});
