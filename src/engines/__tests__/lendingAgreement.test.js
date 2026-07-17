import { describe, it, expect } from "vitest";
import { buildPromissoryNoteText } from "../lendingAgreement.js";

describe("lendingAgreement", () => {
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
});
