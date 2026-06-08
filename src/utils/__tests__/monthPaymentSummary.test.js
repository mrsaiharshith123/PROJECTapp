import { describe, it, expect } from "vitest";
import { computeCurrentMonthSummary } from "../monthPaymentSummary.js";

const pending = () => "pending";
const active = () => "active";

describe("computeCurrentMonthSummary", () => {
  it("subtracts logged daily spends from free cash", () => {
    const summary = computeCurrentMonthSummary(
      [
        {
          amount: 5000,
          remainingAmount: 5000,
          repeatType: "monthly",
          dueDate: "2026-06-10",
          payments: [{ amount: 5000, date: "2026-06-10" }],
        },
      ],
      pending,
      "2026-06-15",
      50000,
      {
        dailySpends: [{ id: "s1", amount: 3000, date: "2026-06-12", label: "Swiggy", lifeCategory: "lifestyle" }],
      },
    );
    expect(summary.spentThisMonth).toBe(3000);
    expect(summary.freeCash).toBe(42000);
  });

  it("includes lending due in month totals", () => {
    const summary = computeCurrentMonthSummary(
      [],
      pending,
      "2026-06-15",
      50000,
      {
        lendings: [
          {
            type: "borrowed",
            remainingAmount: 10000,
            repaymentSchedule: [{ dueDate: "2026-06-20", totalPayment: 5000, paymentStatus: "pending" }],
          },
        ],
        getEffectiveLendingStatus: active,
      },
    );
    expect(summary.lendingDueThisMonth).toBe(5000);
    expect(summary.dueThisMonth).toBe(5000);
  });

  it("returns spend guidance when income is set", () => {
    const summary = computeCurrentMonthSummary(
      [{ amount: 30000, remainingAmount: 30000, repeatType: "monthly", dueDate: "2026-06-25" }],
      pending,
      "2026-06-15",
      50000,
      {},
    );
    expect(summary.spendGuidance).not.toBeNull();
    expect(summary.spendGuidance.dailyLifestyleCap).toBeGreaterThan(0);
  });
});
