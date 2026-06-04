import { describe, expect, it } from "vitest";
import { matchDebitToCommitment } from "../smsCommitmentMatcher.js";

const getEff = (c) => c.status;

describe("matchDebitToCommitment", () => {
  const commitments = [
    { id: 1, name: "Rent", amount: 15000, remainingAmount: 15000, dueDate: "2026-06-01", status: "pending" },
    { id: 2, name: "Netflix", amount: 649, remainingAmount: 649, dueDate: "2026-06-10", status: "paid" },
    { id: 3, name: "EMI", amount: 8000, remainingAmount: 8000, dueDate: "2026-06-04", status: "overdue" },
  ];

  it("matches exact amount to closest due date", () => {
    const m = matchDebitToCommitment(
      { amount: 8000, bank: "HDFC", last4: null, date: "2026-06-04" },
      commitments,
      getEff,
    );
    expect(m?.id).toBe(3);
  });

  it("never matches paid commitments", () => {
    const m = matchDebitToCommitment(
      { amount: 649, bank: "HDFC", last4: null, date: "2026-06-10" },
      commitments,
      getEff,
    );
    expect(m).toBeNull();
  });
});
