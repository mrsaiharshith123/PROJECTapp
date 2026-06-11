import { todayYmd } from "./dates.js";
import { commitmentSeriesKey } from "./billLifecycle.js";
import {
  grossObligationInMonth,
  normalizeRepeatType,
  paymentsInMonth,
} from "../constants/repeatTypes.js";

/**
 * @param {{ amount: number, date: string }[]} payments
 */
export function totalPaidOnPayments(payments) {
  if (!Array.isArray(payments)) return 0;
  return payments.reduce((s, p) => s + Math.max(0, Number(p.amount) || 0), 0);
}

function seriesPayments(allCommitments, c) {
  if (!Array.isArray(allCommitments) || allCommitments.length === 0) {
    return c.payments || [];
  }
  const key = commitmentSeriesKey(c);
  return allCommitments.filter((x) => commitmentSeriesKey(x) === key).flatMap((x) => x.payments || []);
}

/** yyyy-MM for the installment currently due on this row. */
export function currentDueMonthKey(c, todayStr = todayYmd()) {
  return (c.dueDate || todayStr).slice(0, 7);
}

export function isDueMonthPaid(c, monthKey, todayStr = todayYmd(), allCommitments = []) {
  const gross = grossObligationInMonth(c, monthKey, monthKey.slice(5, 7), todayStr);
  if (gross <= 0) return false;
  const pays = seriesPayments(allCommitments, c);
  const paid = pays
    .filter((p) => (p.date || "").startsWith(monthKey))
    .reduce((s, p) => s + Math.max(0, Number(p.amount) || 0), 0);
  return paid >= gross - 0.01;
}

/**
 * Index of the last payment row for the current cycle (for undo). -1 if none.
 * @param {object} c
 * @param {string} [todayStr]
 * @param {object[]} [allCommitments]
 */
export function lastUndoablePaymentIndex(c, todayStr = todayYmd(), allCommitments = []) {
  if (!isCurrentCyclePaid(c, todayStr, allCommitments)) return -1;
  const payments = c.payments || [];
  if (!payments.length) return -1;

  const rt = normalizeRepeatType(c.repeatType);
  if (rt === "none") return payments.length - 1;

  const monthKey = currentDueMonthKey(c, todayStr);
  for (let i = payments.length - 1; i >= 0; i--) {
    if ((payments[i].date || "").startsWith(monthKey)) return i;
  }
  return -1;
}

/** True when this month's installment is fully recorded (locks pay until next cycle). */
export function isCurrentCyclePaid(c, todayStr = todayYmd(), allCommitments = []) {
  const rt = normalizeRepeatType(c.repeatType);
  if (rt === "none") {
    const total = Math.max(0, Number(c.amount) || 0);
    return totalPaidOnPayments(c.payments) >= total - 0.01;
  }
  return isDueMonthPaid(c, currentDueMonthKey(c, todayStr), todayStr, allCommitments);
}

/**
 * Amount still due for the current installment only (not full contract).
 */
export function currentCycleRemainingAmount(c, todayStr = todayYmd(), allCommitments = []) {
  const rt = normalizeRepeatType(c.repeatType);
  const perCycle = Math.max(0, Number(c.amount) || 0);

  if (rt === "none") {
    return Math.max(0, perCycle - totalPaidOnPayments(c.payments));
  }

  const monthKey = currentDueMonthKey(c, todayStr);
  const gross = grossObligationInMonth(c, monthKey, monthKey.slice(5, 7), todayStr) || perCycle;
  const paid = paymentsInMonth({ ...c, payments: seriesPayments(allCommitments, c) }, monthKey);
  return Math.max(0, Math.round(gross - paid));
}

/** @alias currentCycleRemainingAmount */
export function suggestedCyclePaymentAmount(c, todayStr = todayYmd(), allCommitments = []) {
  return currentCycleRemainingAmount(c, todayStr, allCommitments);
}

/**
 * @param {object} c commitment
 * @param {{ amount: number, date: string }} payment
 * @param {object[]} [allCommitments]
 * @param {string} [todayStr]
 * @returns {object} updated commitment
 */
export function applyPaymentToCommitment(c, payment, allCommitments = [], todayStr = todayYmd()) {
  const payAmt = Math.max(0, Number(payment.amount) || 0);
  const date = payment.date || "";
  const cycleDue = currentCycleRemainingAmount(c, todayStr, allCommitments);
  const applied = Math.min(payAmt, Math.max(0, cycleDue));
  const newPayments = [...(c.payments || []), { amount: applied, date }];
  const newRemaining = Math.max(0, cycleDue - applied);
  const now = Date.now();
  return {
    ...c,
    payments: newPayments,
    remainingAmount: newRemaining,
    updatedAt: now,
  };
}
