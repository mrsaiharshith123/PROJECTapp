import { describe, expect, it } from "vitest";
import { refreshChitCommitment } from "../chitSync.js";

describe("refreshChitCommitment", () => {
  it("lowers installment when calendar month advances", () => {
    const c = {
      category: "Chit Fund",
      chitValue: 100000,
      chitMonths: 10,
      chitCurrentMonth: 1,
      startDate: "2024-01-15",
      amount: 18182,
      remainingAmount: 18182,
      payments: [],
      chitTaken: false,
    };
    const next = refreshChitCommitment(c, "2024-06-15");
    expect(next.chitCurrentMonth).toBeGreaterThan(1);
    expect(next.amount).toBeLessThan(c.amount);
    expect(next.remainingAmount).toBeGreaterThanOrEqual(next.amount);
  });
});
