import { compareYmd } from "./dates.js";
import { applyStructuredLendingPayment } from "./lendingPayments.js";

/**
 * @param {object} l
 * @param {string} todayStr
 * @returns {"pending" | "overdue" | "complete"}
 */
export function getEffectiveLendingStatus(l, todayStr) {
  const remaining = Number(l.remainingAmount ?? l.totalAmount ?? 0);
  if (remaining <= 0) return "complete";
  if (l.dueDate && compareYmd(l.dueDate, todayStr) < 0 && remaining > 0) return "overdue";
  return "pending";
}

export function totalPaidOnLendingPayments(payments) {
  if (!Array.isArray(payments)) return 0;
  return payments.reduce((s, p) => s + Math.max(0, Number(p.amount) || 0), 0);
}

/**
 * @param {object} l
 * @param {{ amount: number, date: string }} payment
 */
export function applyPaymentToLending(l, payment, todayStr = "") {
  return applyStructuredLendingPayment(l, payment, todayStr);
}
