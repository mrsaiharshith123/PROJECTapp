import { describe, expect, it } from "vitest";
import { mergeFinancialLifeItems } from "../mergeFinancialLifeItems.js";

describe("mergeFinancialLifeItems", () => {
  it("keeps only one emergency insight when journey and net worth conflict", () => {
    const merged = mergeFinancialLifeItems(
      [{ id: "emergency-ok", tone: "positive", key: "profileHub.journey.emergencyImproved" }],
      [{ id: "emergency-low", tone: "action", key: "netWorth.insight.emergencyLow" }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].key).toBe("netWorth.insight.emergencyLow");
  });

  it("preserves distinct topics", () => {
    const merged = mergeFinancialLifeItems(
      [{ id: "recurring-stable", tone: "positive", key: "profileHub.journey.recurringStable" }],
      [{ id: "life-thriving", tone: "calm", key: "netWorth.insight.lifeThriving" }],
    );
    expect(merged).toHaveLength(2);
  });
});
