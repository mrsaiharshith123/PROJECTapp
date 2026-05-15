import { compareYmd } from "./dates.js";
import { applyPaymentToSchedule } from "./repayment/payments.js";
import { calculateRemainingFromSchedule } from "./repayment/payments.js";
import { totalPaidOnLendingPayments } from "./lendingStatus.js";

/**
 * Apply payment with schedule allocation + timeline event.
 */
export function applyStructuredLendingPayment(l, payment, todayStr) {
  const payAmt = Math.max(0, Number(payment.amount) || 0);
  const payDate = String(payment.date || todayStr || "").slice(0, 10);
  const total = Math.max(0, Number(l.totalPayable ?? l.totalAmount) || 0);
  const prevPaid = totalPaidOnLendingPayments(l.payments);
  const remainingBefore = Math.max(
    0,
    Number(l.remainingBalance ?? l.remainingAmount) || Math.max(0, total - prevPaid)
  );
  const cap = Math.min(payAmt, remainingBefore);
  const onTime =
    payment.onTime != null
      ? Boolean(payment.onTime)
      : !l.dueDate || compareYmd(payDate, l.dueDate) <= 0;

  let schedule = l.repaymentSchedule || [];
  let principalPortion;
  let interestPortion;
  if (schedule.length > 0) {
    const result = applyPaymentToSchedule(schedule, { amount: cap, date: payDate }, todayStr);
    schedule = result.schedule;
    principalPortion = result.principalPaid;
    interestPortion = result.interestPaid;
  } else {
    principalPortion = cap;
    interestPortion = 0;
  }

  const rem = calculateRemainingFromSchedule(schedule);
  const newRemaining =
    schedule.length > 0 ? rem.remainingBalance : Math.max(0, total - prevPaid - cap);

  const paymentType = cap >= remainingBefore - 0.01 ? "full" : "partial";
  const newPayments = [
    ...(l.payments || []),
    {
      amount: cap,
      date: payDate,
      onTime,
      principalPortion,
      interestPortion,
      paymentType,
    },
  ];

  const timelineEvent = {
    id: `pay-${Date.now()}`,
    type: "payment",
    message: `₹${cap.toLocaleString()} received`,
    createdAt: Date.now(),
    metadata: { amount: cap, principalPortion, interestPortion, paymentType },
  };

  const now = Date.now();
  const next = {
    ...l,
    payments: newPayments,
    repaymentSchedule: schedule,
    remainingAmount: newRemaining,
    remainingBalance: newRemaining,
    remainingPrincipal: rem.remainingPrincipal,
    remainingInterest: rem.remainingInterest,
    paymentTimeline: [...(l.paymentTimeline || []), timelineEvent],
    updatedAt: now,
  };

  if (newRemaining <= 0) {
    return { ...next, status: "complete" };
  }
  return next;
}
