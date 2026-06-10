import { describe, expect, it } from "vitest";
import { generateCommitmentInsights } from "../intelligence.js";

const pending = () => "pending";

describe("generateCommitmentInsights", () => {
  it("flags high burden ratio", () => {
    const insights = generateCommitmentInsights({
      commitments: [{ amount: 50000, repeatType: "monthly", remainingAmount: 0 }],
      snapshots: [],
      income: 60000,
      getEffectiveStatus: pending,
    });
    expect(insights.some((i) => i.id === "burden-danger" || i.id === "burden-risk")).toBe(true);
  });

  it("returns insight ids with tone only", () => {
    const insights = generateCommitmentInsights({
      commitments: [
        { category: "Subscription", amount: 2000, repeatType: "monthly", remainingAmount: 0 },
      ],
      snapshots: [],
      income: 100000,
      getEffectiveStatus: pending,
    });
    expect(insights.length).toBeGreaterThan(0);
    for (const ins of insights) {
      expect(ins.id).toBeTruthy();
      expect(ins.tone).toBeTruthy();
      expect(ins.text).toBeUndefined();
    }
  });
});
