import { describe, it, expect } from "vitest";
import { computeBillSplit, buildLendingRecordsFromSplit, billSplitSummaryLine } from "../billSplit.js";

describe("billSplit", () => {
  it("splits equally across participants", () => {
    const split = computeBillSplit(1000, [{ name: "A" }, { name: "B" }, { name: "C" }]);
    expect(split.participants).toHaveLength(3);
    expect(split.participants.reduce((s, p) => s + p.amount, 0)).toBe(1000);
  });

  it("respects custom weights", () => {
    const split = computeBillSplit(1000, [
      { name: "A", weight: 2 },
      { name: "B", weight: 1 },
    ]);
    expect(split.participants[0].amount).toBeGreaterThan(split.participants[1].amount);
  });

  it("builds lending records from split", () => {
    const split = computeBillSplit(600, [{ name: "Ravi" }, { name: "Priya" }]);
    const records = buildLendingRecordsFromSplit(split);
    expect(records).toHaveLength(2);
    expect(records[0].type).toBe("lent");
    expect(records[0].billSplit).toBe(true);
  });

  it("formats summary line", () => {
    const split = computeBillSplit(500, [{ name: "A" }]);
    expect(billSplitSummaryLine(split)).toMatch(/A/);
  });
});
