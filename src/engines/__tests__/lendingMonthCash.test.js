import { describe, it, expect } from "vitest";
import {
  lendingDueInMonth,
  totalMonthlyLendingBurden,
  monthlyBurdenForLending,
} from "../lendingMonthCash.js";

const active = () => "active";

describe("lendingMonthCash", () => {
  it("sums unpaid borrowed installments in month", () => {
    const due = lendingDueInMonth(
      [
        {
          type: "borrowed",
          repaymentSchedule: [
            { dueDate: "2026-06-10", totalPayment: 2000, paymentStatus: "paid" },
            { dueDate: "2026-06-25", totalPayment: 3000, paymentStatus: "pending" },
          ],
        },
      ],
      "2026-06",
      active,
      "2026-06-15",
    );
    expect(due).toBe(3000);
  });

  it("adds recurring lending burden for active borrowed loans", () => {
    const burden = totalMonthlyLendingBurden(
      [
        { type: "borrowed", remainingAmount: 12000, expectedInstallment: 4000, repaymentType: "monthly" },
        { type: "lent", remainingAmount: 5000, expectedInstallment: 1000 },
      ],
      active,
      "2026-06-15",
    );
    expect(burden).toBe(4000);
    expect(monthlyBurdenForLending({ type: "lent" }, active, "2026-06-15")).toBe(0);
  });
});
