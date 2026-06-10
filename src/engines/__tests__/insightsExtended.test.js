import { describe, expect, it } from "vitest";
import { emiBurdenPercentInsight, mergeExtendedInsights } from "../insightsExtended.js";

const pending = () => "pending";

describe("insightsExtended", () => {
  it("flags high EMI percent of income", () => {
    const ins = emiBurdenPercentInsight(
      [{ category: "EMI", amount: 40000, repeatType: "monthly", remainingAmount: 0 }],
      50000,
      pending,
    );
    expect(ins?.id).toBe("emi-pct");
  });

  it("merges extended insights without duplicate ids", () => {
    const merged = mergeExtendedInsights(
      [{ id: "a", tone: "info" }],
      [{ id: "b", tone: "warning" }, { id: "a", tone: "info" }],
    );
    expect(merged.filter((i) => i.id === "a").length).toBe(1);
    expect(merged.length).toBe(2);
  });
});
