import { describe, expect, it } from "vitest";
import {
  getOverdueInstallments,
  computeOverdueTotal,
  isInDefault,
  buildDefaultNoticeText,
} from "../lendingRecovery.js";

const today = new Date();
const past = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(Math.max(1, today.getDate() - 10)).padStart(2, "0")}`;
const veryOld = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
if (Number(veryOld.slice(8, 10)) >= today.getDate()) {
  // ensure veryOld is before today
}

describe("lendingRecovery", () => {
  const allPaid = {
    personName: "Ravi",
    principalAmount: 50000,
    repaymentSchedule: [
      { installmentNumber: 1, dueDate: past, totalPayment: 5000, paymentStatus: "paid" },
    ],
  };

  it("getOverdueInstallments returns empty for all-paid schedule", () => {
    expect(getOverdueInstallments(allPaid)).toEqual([]);
  });

  it("getOverdueInstallments returns past-due items only", () => {
    const lending = {
      repaymentSchedule: [
        { dueDate: past, totalPayment: 3000, paymentStatus: "pending" },
        { dueDate: "2099-12-31", totalPayment: 3000, paymentStatus: "pending" },
      ],
    };
    const overdue = getOverdueInstallments(lending);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].dueDate).toBe(past);
  });

  it("computeOverdueTotal sums correctly", () => {
    expect(
      computeOverdueTotal([
        { totalPayment: 1000 },
        { totalPayment: 2500 },
      ])
    ).toBe(3500);
  });

  it("isInDefault returns false when all paid", () => {
    expect(isInDefault(allPaid)).toBe(false);
  });

  it("isInDefault returns true when installment is more than 7 days overdue", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8);
    const ymd = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, "0")}-${String(oldDate.getDate()).padStart(2, "0")}`;
    expect(
      isInDefault({
        repaymentSchedule: [{ dueDate: ymd, totalPayment: 5000, paymentStatus: "pending" }],
      })
    ).toBe(true);
  });

  it("buildDefaultNoticeText contains borrower name and principal", () => {
    const text = buildDefaultNoticeText(
      {
        type: "lent",
        personName: "Ravi Kumar",
        borrowerFullName: "Ravi Kumar",
        principalAmount: 25000,
        remainingAmount: 20000,
        agreementCity: "Bengaluru",
        startDate: "2026-01-01",
        repaymentSchedule: [{ dueDate: past, totalPayment: 5000, paymentStatus: "pending" }],
      },
      { displayName: "Harsha" }
    );
    expect(text).toContain("NOTICE FOR PAYMENT");
    expect(text).toContain("Ravi Kumar");
    expect(text).toContain("25,000");
  });
});
