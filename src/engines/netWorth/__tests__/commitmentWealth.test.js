import { describe, expect, it } from "vitest";
import { deriveWealthFromCommitments, mapBillCategoryToLiabilityId } from "../commitmentWealth.js";

describe("commitmentWealth", () => {
  it("maps home loan names to home_loan category", () => {
    expect(mapBillCategoryToLiabilityId("Loan", "HDFC Home Loan")).toBe("home_loan");
    expect(mapBillCategoryToLiabilityId("EMI", "Car EMI")).toBe("vehicle_loan");
  });

  it("derives liabilities from active loan bills with balance", () => {
    const rows = deriveWealthFromCommitments(
      [
        {
          id: "a",
          name: "SBI Home",
          category: "Loan",
          remainingAmount: 2500000,
          amount: 28000,
          interestRate: 8.5,
          status: "pending",
        },
        {
          id: "b",
          name: "Netflix",
          category: "Subscription",
          remainingAmount: 0,
          amount: 649,
          status: "pending",
        },
      ],
      () => "pending",
      "2026-06-08",
    );
    expect(rows.liabilities).toHaveLength(1);
    expect(rows.liabilities[0].categoryId).toBe("home_loan");
    expect(rows.liabilities[0].value).toBe(2500000);
    expect(rows.assets).toHaveLength(0);
  });
});
