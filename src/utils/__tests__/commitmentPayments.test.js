import { describe, it, expect } from "vitest";
import { applyPaymentToCommitment, suggestedCyclePaymentAmount } from "../commitmentPayments.js";

describe("applyPaymentToCommitment", () => {
  it("applies payment up to contract remaining", () => {
    const c = {
      amount: 2500,
      remainingAmount: 2500,
      repeatType: "none",
      payments: [],
    };
    const next = applyPaymentToCommitment(c, { amount: 2500, date: "2026-05-01" });
    expect(next.payments[0].amount).toBe(2500);
    expect(next.remainingAmount).toBe(0);
  });
});

describe("suggestedCyclePaymentAmount", () => {
  it("uses per-cycle amount for recurring bills, not full contract remaining", () => {
    const c = {
      amount: 5000,
      remainingAmount: 150000,
      repeatType: "monthly",
      startDate: "2024-01-01",
      endDate: "2027-12-01",
      dueDate: "2026-05-10",
      payments: [],
    };
    expect(suggestedCyclePaymentAmount(c, "2026-05-19", [c])).toBe(5000);
  });

  it("uses full remaining for one-off bills", () => {
    const c = {
      amount: 50000,
      remainingAmount: 50000,
      repeatType: "none",
      payments: [],
    };
    expect(suggestedCyclePaymentAmount(c, "2026-05-19", [c])).toBe(50000);
  });
});
