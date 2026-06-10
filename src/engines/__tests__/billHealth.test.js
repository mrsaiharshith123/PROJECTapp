import { describe, expect, it } from "vitest";
import { scoreBillHealth, aggregateBillHealthScore } from "../billHealth.js";

describe("scoreBillHealth", () => {
  it("flags overdue bills as stress", () => {
    const r = scoreBillHealth({ name: "Rent", category: "Rent" }, { effectiveStatus: "overdue" });
    expect(r.band).toBe("stress");
    expect(r.insightId).toBe("bill-health-overdue");
  });

  it("flags idle subscriptions", () => {
    const r = scoreBillHealth(
      { name: "Spotify", category: "Subscription" },
      { effectiveStatus: "pending", todayStr: "2026-06-10", dailySpends: [] },
    );
    expect(r.insightId).toBe("bill-health-idle-sub");
  });
});

describe("aggregateBillHealthScore", () => {
  it("averages scores and flags stress band", () => {
    const r = aggregateBillHealthScore([
      { score: 40, band: "stress" },
      { score: 80, band: "good" },
    ]);
    expect(r.score).toBe(60);
    expect(r.stressCount).toBe(1);
    expect(r.insightId).toBe("bill-portfolio-stress");
  });
});
