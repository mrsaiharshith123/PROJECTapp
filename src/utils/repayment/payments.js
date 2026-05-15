import { compareYmd } from "../dates.js";
import { calculateLatePenalty } from "./calculations.js";

/**
 * Apply payment to schedule rows (oldest unpaid first).
 * @returns {{ schedule: object[], applied: number, principalPaid: number, interestPaid: number }}
 */
export function applyPaymentToSchedule(schedule, payment, todayStr) {
  const payAmt = Math.max(0, Number(payment.amount) || 0);
  const payDate = String(payment.date || todayStr || "").slice(0, 10);
  if (payAmt <= 0 || !Array.isArray(schedule)) {
    return { schedule: schedule || [], applied: 0, principalPaid: 0, interestPaid: 0 };
  }

  let remaining = payAmt;
  let principalPaid = 0;
  let interestPaid = 0;
  const next = schedule.map((row) => ({ ...row }));

  for (const row of next) {
    if (remaining <= 0) break;
    if (row.paymentStatus === "paid") continue;
    const due = row.totalPayment + (row.lateDays > 0 ? calculateLatePenalty(row.totalPayment, row.lateDays) : 0);
    const applied = Math.min(remaining, due);
    if (applied <= 0) continue;
    const ratio = due > 0 ? applied / due : 1;
    const pPart = (Number(row.principalComponent) || 0) * ratio;
    const iPart = (Number(row.interestComponent) || 0) * ratio;
    principalPaid += pPart;
    interestPaid += iPart;
    remaining -= applied;
    if (applied >= due - 0.01) {
      row.paymentStatus = "paid";
      row.paidAt = payDate;
      row.lateDays = 0;
    } else {
      row.paymentStatus = "partial";
      row.paidAt = payDate;
    }
    if (todayStr && compareYmd(row.dueDate, payDate) < 0 && row.paymentStatus !== "paid") {
      row.paymentStatus = "overdue";
    }
  }

  return {
    schedule: next,
    applied: payAmt - remaining,
    principalPaid: Math.round(principalPaid * 100) / 100,
    interestPaid: Math.round(interestPaid * 100) / 100,
  };
}

export function calculateRemainingFromSchedule(schedule) {
  if (!Array.isArray(schedule)) return { remainingPrincipal: 0, remainingInterest: 0, remainingBalance: 0 };
  let remainingPrincipal = 0;
  let remainingInterest = 0;
  for (const row of schedule) {
    if (row.paymentStatus === "paid") continue;
    remainingPrincipal += Number(row.principalComponent) || 0;
    remainingInterest += Number(row.interestComponent) || 0;
  }
  const remainingBalance = remainingPrincipal + remainingInterest;
  return {
    remainingPrincipal: Math.round(remainingPrincipal * 100) / 100,
    remainingInterest: Math.round(remainingInterest * 100) / 100,
    remainingBalance: Math.round(remainingBalance * 100) / 100,
  };
}

export function applyPrepaymentToSchedule(schedule, extraPrincipal) {
  const extra = Math.max(0, Number(extraPrincipal) || 0);
  if (extra <= 0) return schedule;
  const next = schedule.map((r) => ({ ...r }));
  let left = extra;
  for (let i = next.length - 1; i >= 0 && left > 0; i--) {
    const row = next[i];
    if (row.paymentStatus === "paid") continue;
    const cut = Math.min(left, Number(row.principalComponent) || 0);
    row.principalComponent = Math.max(0, (Number(row.principalComponent) || 0) - cut);
    row.totalPayment = (Number(row.principalComponent) || 0) + (Number(row.interestComponent) || 0);
    row.remainingBalance = Math.max(0, (Number(row.remainingBalance) || 0) - cut);
    left -= cut;
    if (row.totalPayment < 0.01) row.paymentStatus = "paid";
  }
  return next;
}
