import { describe, it, expect } from "vitest";
import { isLiabilityCommitment, LIABILITY_COMMITMENT_CATEGORIES } from "../ledgerBuckets.js";
import { CATEGORIES, categoryShowsInterestRate } from "../../../constants/categories.js";

describe("LIABILITY_COMMITMENT_CATEGORIES — regression", () => {
  it("only contains category ids that actually exist in constants/categories.js", () => {
    const realIds = new Set(CATEGORIES.map((c) => c.id));
    for (const id of LIABILITY_COMMITMENT_CATEGORIES) {
      expect(realIds.has(id)).toBe(true);
    }
  });

  it("treats Equipment commitments as liabilities (previously silently excluded)", () => {
    expect(isLiabilityCommitment({ category: "Equipment" })).toBe(true);
  });

  it("every interest-bearing category is also a liability category", () => {
    // Anything that shows an interest rate (EMI/Loan/Credit Card/BNPL/Equipment)
    // represents debt and must appear in the Liabilities ledger view.
    for (const c of CATEGORIES) {
      if (categoryShowsInterestRate(c.id)) {
        expect(LIABILITY_COMMITMENT_CATEGORIES.has(c.id)).toBe(true);
      }
    }
  });

  it("does not treat non-debt categories as liabilities", () => {
    expect(isLiabilityCommitment({ category: "Groceries" })).toBe(false);
    expect(isLiabilityCommitment({ category: "Rent" })).toBe(false);
  });
});
