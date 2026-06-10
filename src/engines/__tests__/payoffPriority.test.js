import { describe, expect, it } from "vitest";
import { rankPayoffOrder } from "../payoffPriority.js";

const pending = () => "pending";

describe("rankPayoffOrder", () => {
  it("sorts payoff candidates by descending priority score", () => {
    const rows = rankPayoffOrder(
      [
        { id: 1, name: "A", category: "Loan", amount: 5000, annualInterestRate: 8, remainingAmount: 10000 },
        { id: 2, name: "B", category: "Loan", amount: 5000, annualInterestRate: 36, remainingAmount: 120000, priority: "critical" },
      ],
      pending,
      "2026-06-10",
    );
    expect(rows.length).toBe(2);
    expect(rows[0].score).toBeGreaterThan(rows[1].score);
    expect(rows[0].commitment.name).toBe("B");
  });
});
