import { describe, expect, it } from "vitest";
import {
  numberToWords,
  buildPromissoryNoteText,
  isAgreementFullyLocked,
} from "../lendingAgreement.js";

describe("lendingAgreement", () => {
  it("numberToWords formats common amounts", () => {
    expect(numberToWords(0)).toBe("Zero");
    expect(numberToWords(25000)).toBe("Twenty Five Thousand");
    expect(numberToWords(150000)).toBe("One Lakh Fifty Thousand");
    expect(numberToWords(10000000)).toBe("One Crore");
  });

  it("buildPromissoryNoteText includes header and borrower name", () => {
    const text = buildPromissoryNoteText(
      {
        type: "lent",
        personName: "Ravi Kumar",
        borrowerFullName: "Ravi Kumar",
        principalAmount: 25000,
        totalAmount: 25000,
        interestRate: 12,
        agreementCity: "Bengaluru",
      },
      { displayName: "Harsha" }
    );
    expect(text).toContain("PROMISSORY NOTE");
    expect(text).toContain("Ravi Kumar");
  });

  it("isAgreementFullyLocked is false without party confirmations", () => {
    expect(
      isAgreementFullyLocked({
        remainingAmount: 10000,
        agreementLocked: false,
        agreementAccepted: false,
      })
    ).toBe(false);
  });

  it("isAgreementFullyLocked is true when both parties confirmed", () => {
    expect(
      isAgreementFullyLocked({
        remainingAmount: 10000,
        lenderConfirmedAt: "2026-06-01T00:00:00.000Z",
        borrowerConfirmedAt: "2026-06-02T00:00:00.000Z",
      })
    ).toBe(true);
  });

  it("isAgreementFullyLocked is false when loan is settled", () => {
    expect(
      isAgreementFullyLocked({
        remainingAmount: 0,
        status: "complete",
        lenderConfirmedAt: "2026-06-01",
        borrowerConfirmedAt: "2026-06-02",
      })
    ).toBe(false);
  });
});
