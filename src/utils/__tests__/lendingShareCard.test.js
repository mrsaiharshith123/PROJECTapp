import { describe, expect, it } from "vitest";
import { generateLendingShareCardHtml, lendingSharePlainText } from "../lendingShareCard.js";

describe("lendingShareCard", () => {
  const lending = {
    type: "lent",
    personName: "Ravi Kumar",
    principalAmount: 50000,
    remainingAmount: 32000,
    repaymentFrequency: "monthly",
    repaymentSchedule: [{ dueDate: "2026-07-01", paymentStatus: "pending", installmentNumber: 1 }],
  };

  it("includes borrower name and formatted principal in HTML", () => {
    const html = generateLendingShareCardHtml(lending, { displayName: "Harsha" });
    expect(html).toContain("Ravi Kumar");
    expect(html).toContain("₹50,000");
    expect(html).toContain("CommitTrack");
  });

  it("builds plain-text fallback", () => {
    const text = lendingSharePlainText(lending, { displayName: "Harsha" });
    expect(text).toContain("Ravi Kumar");
    expect(text).toContain("₹50,000");
  });
});
