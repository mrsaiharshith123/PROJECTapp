import { describe, it, expect } from "vitest";
import { computeBillSpendSummary } from "../commitmentSpendSummary.js";

describe("computeBillSpendSummary", () => {
  it("sums payments across rolled recurring rows", () => {
    const netflix = { profileId: "default", category: "Subscription", name: "Netflix", amount: 199, repeatType: "monthly" };
    const all = [
      { ...netflix, id: 1, payments: [{ amount: 199, date: "2025-10-01" }, { amount: 199, date: "2025-11-01" }] },
      { ...netflix, id: 2, payments: [{ amount: 199, date: "2025-12-01" }] },
      { ...netflix, id: 3, payments: [{ amount: 199, date: "2026-01-01" }, { amount: 199, date: "2026-02-01" }] },
    ];
    const summary = computeBillSpendSummary(all[2], "2026-05-01", all);
    expect(summary.recordedAllTime).toBe(199 * 5);
    expect(summary.priorSpend).toBe(0);
  });
});
