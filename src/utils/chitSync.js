import {
  deriveChitCurrentMonth,
  resolveChitInstallment,
  chitCurrentMonthFromMonthsPaid,
} from "../engines/chitFund.js";
import { totalPaidOnPayments } from "./commitmentPayments.js";

/**
 * Align chit bill to calendar month: installment updates each month automatically.
 * Unpaid balance from a prior month is carried into the new month's due.
 */
export function refreshChitCommitment(c, todayStr) {
  if (c.category !== "Chit Fund" || c.chitTaken) return c;
  const V = Number(c.chitValue) || 0;
  const N = Math.floor(Number(c.chitMonths) || 0);
  if (V <= 0 || N <= 0) return c;

  const start = c.startDate || c.dueDate;
  if (!start) return c;

  const mode = c.chitInstallmentMode || "equal";
  const custom = c.chitCustomInstallment ?? c.amount;

  const storedMonth = Math.max(1, Math.floor(Number(c.chitCurrentMonth) || 1));
  const targetMonth =
    c.chitMonthsPaid != null && !Number.isNaN(Number(c.chitMonthsPaid))
      ? chitCurrentMonthFromMonthsPaid(c.chitMonthsPaid, N)
      : Math.max(storedMonth, deriveChitCurrentMonth(start, N, todayStr));

  const newInstallment = Math.round(resolveChitInstallment(V, N, targetMonth, mode, custom));
  const paidThisCycle = totalPaidOnPayments(c.payments);

  let remainingAmount;
  if (targetMonth > storedMonth) {
    const carry = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
    remainingAmount = Math.max(0, Math.round(carry + newInstallment - paidThisCycle));
  } else {
    remainingAmount = Math.max(0, Math.round(newInstallment - paidThisCycle));
  }

  const unchanged =
    targetMonth === storedMonth &&
    Number(c.amount) === newInstallment &&
    Number(c.remainingAmount) === remainingAmount;

  if (unchanged) return c;

  return {
    ...c,
    chitCurrentMonth: targetMonth,
    amount: newInstallment,
    remainingAmount,
    updatedAt: Date.now(),
  };
}

export function refreshAllChitCommitments(commitments, todayStr) {
  if (!Array.isArray(commitments)) return commitments;
  return commitments.map((c) => refreshChitCommitment(c, todayStr));
}
