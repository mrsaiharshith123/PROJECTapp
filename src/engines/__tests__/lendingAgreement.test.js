import { describe, it, expect } from "vitest";
import {
  buildPromissoryNoteText,
  numberToWords,
  borrowerTrustSnapshot,
} from "../lendingAgreement.js";

describe("lendingAgreement", () => {
  it("numberToWords handles typical principal amounts", () => {
    expect(numberToWords(100000)).toMatch(/lakh/i);
    expect(numberToWords(0)).toBe("zero rupees only");
  });

  it("buildPromissoryNoteText strips HTML from borrower name", () => {
    const text = buildPromissoryNoteText(
      {
        borrowerFullName: "<script>alert(1)</script>Ravi",
        principalAmount: 50000,
        interestRate: 12,
        startDate: "2025-01-01",
      },
      { displayName: "Lender" },
    );
    expect(text).not.toContain("<script>");
    expect(text).toContain("Ravi");
  });

  it("borrowerTrustSnapshot returns finite score", () => {
    const snap = borrowerTrustSnapshot(
      [
        {
          type: "lent",
          personName: "Ravi",
          principalAmount: 10000,
          remainingAmount: 5000,
          status: "active",
        },
      ],
      "Ravi",
    );
    expect(Number.isFinite(snap.score)).toBe(true);
  });
});
