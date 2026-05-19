import { describe, it, expect } from "vitest";
import { applyPaymentToCommitment } from "../commitmentPayments.js";

describe("applyPaymentToCommitment", () => {
  it("applies payment up to remainingAmount when above cycle amount", () => {
    const c = {
      amount: 1000,
      remainingAmount: 2500,
      payments: [],
    };
    const next = applyPaymentToCommitment(c, { amount: 2500, date: "2026-05-01" });
    expect(next.payments[0].amount).toBe(2500);
    expect(next.remainingAmount).toBe(0);
  });
});
