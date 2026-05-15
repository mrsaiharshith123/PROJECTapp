import { describe, it, expect } from "vitest";
import { advanceRecurringCommitment } from "../commitmentRecurring.js";

describe("advanceRecurringCommitment", () => {
  it("advances monthly due date on new row", () => {
    const c = {
      id: 1,
      repeatType: "monthly",
      dueDate: "2026-04-15",
      amount: 1000,
      remainingAmount: 0,
      name: "Rent",
      payments: [{ amount: 1000, date: "2026-04-15" }],
    };
    const { paidRow, nextCycle } = advanceRecurringCommitment(c, 999);
    expect(paidRow.status).toBe("paid");
    expect(paidRow.remainingAmount).toBe(0);
    expect(nextCycle).not.toBeNull();
    expect(nextCycle.id).toBe(999);
    expect(nextCycle.dueDate).toBe("2026-05-15");
    expect(nextCycle.remainingAmount).toBe(1000);
    expect(nextCycle.payments).toEqual([]);
    expect(nextCycle.status).toBe("pending");
  });

  it("marks one-off paid with no next row", () => {
    const c = { repeatType: "none", dueDate: "2026-01-01", amount: 500, remainingAmount: 0 };
    const { paidRow, nextCycle } = advanceRecurringCommitment(c);
    expect(paidRow.status).toBe("paid");
    expect(nextCycle).toBeNull();
  });

  it("returns unchanged when balance remains", () => {
    const c = { repeatType: "monthly", dueDate: "2026-01-01", amount: 500, remainingAmount: 500 };
    const { paidRow, nextCycle } = advanceRecurringCommitment(c);
    expect(paidRow).toBe(c);
    expect(nextCycle).toBeNull();
  });
});
