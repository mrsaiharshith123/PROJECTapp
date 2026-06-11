import { describe, expect, it } from "vitest";
import {
  buildBillBreakdownChartData,
  buildBillTimelineChartData,
} from "../billDetailChartData.js";
import { lastUndoablePaymentIndex, isCurrentCyclePaid } from "../commitmentPayments.js";

const t = (k) => k;

describe("billDetailChartData", () => {
  it("builds paid vs remaining breakdown", () => {
    const rows = buildBillBreakdownChartData({ paidTillNow: 610011, remainingToPay: 107649 }, t);
    expect(rows).toHaveLength(2);
    expect(rows[0].value).toBe(610011);
  });

  it("builds cumulative timeline from payments", () => {
    const bill = {
      id: 1,
      name: "Test",
      category: "Insurance",
      payments: [
        { date: "2026-04-01", amount: 11961 },
        { date: "2026-05-01", amount: 11961 },
      ],
    };
    const timeline = buildBillTimelineChartData(bill, [bill]);
    expect(timeline).toHaveLength(2);
    expect(timeline[1].value).toBe(23922);
  });
});

describe("lastUndoablePaymentIndex", () => {
  it("returns last payment index when cycle is paid", () => {
    const bill = {
      id: 1,
      repeatType: "monthly",
      amount: 11961,
      dueDate: "2026-06-14",
      payments: [{ date: "2026-06-10", amount: 11961 }],
    };
    expect(isCurrentCyclePaid(bill, "2026-06-11", [bill])).toBe(true);
    expect(lastUndoablePaymentIndex(bill, "2026-06-11", [bill])).toBe(0);
  });
});
