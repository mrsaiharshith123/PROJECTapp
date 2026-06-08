import { describe, expect, it } from "vitest";
import { computeBiggestOpenCategory, computeHighestRecurring } from "../billInsightStats.js";

describe("billInsightStats", () => {
  it("picks largest open category balance", () => {
    const top = computeBiggestOpenCategory(
      [
        { category: "EMI", remainingAmount: 100000, status: "pending" },
        { category: "Loan", remainingAmount: 500000, status: "pending" },
      ],
      () => "pending",
    );
    expect(top?.name).toBe("Loan");
    expect(top?.value).toBe(500000);
  });

  it("finds highest recurring bill amount", () => {
    const best = computeHighestRecurring([
      { name: "Netflix", amount: 649, repeatType: "monthly" },
      { name: "Rent", amount: 18000, repeatType: "monthly" },
      { name: "Laptop", amount: 80000, repeatType: "none" },
    ]);
    expect(best?.name).toBe("Rent");
  });
});
