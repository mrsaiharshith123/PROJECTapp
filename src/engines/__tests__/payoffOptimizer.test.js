import { describe, it, expect } from "vitest";
import { comparePayoffStrategies } from "../payoffOptimizer.js";

const getStatus = (c) => c.status;

describe("payoffOptimizer", () => {
  const commitments = [
    { id: 1, name: "Small", remainingAmount: 5000, amount: 5000, status: "pending", category: "Loan" },
    { id: 2, name: "Card", remainingAmount: 20000, amount: 20000, status: "pending", category: "CreditCard" },
  ];

  it("orders snowball by balance", () => {
    const debts = comparePayoffStrategies(commitments, getStatus).snowball;
    expect(debts[0].balance).toBeLessThan(debts[1].balance);
  });

  it("orders avalanche by interest rate", () => {
    const { avalanche } = comparePayoffStrategies(commitments, getStatus);
    const rates = avalanche.map((d) => d.interestRate);
    for (let i = 1; i < rates.length; i++) {
      expect(rates[i - 1]).toBeGreaterThanOrEqual(rates[i]);
    }
  });
});
