/**
 * Lending cash obligations by calendar month — shared by forecast and month summary.
 */

/** @param {object[]} lendings */
/** @param {string} monthKey yyyy-MM */
export function lendingDueInMonth(lendings, monthKey, getEffectiveLendingStatus, todayStr) {
  let sum = 0;
  for (const l of lendings || []) {
    if (l.type !== "borrowed") continue;
    if (getEffectiveLendingStatus(l, todayStr) === "complete") continue;
    for (const row of l.repaymentSchedule || []) {
      if ((row.dueDate || "").startsWith(monthKey) && row.paymentStatus !== "paid") {
        sum += Math.max(0, Number(row.totalPayment) || 0);
      }
    }
    if (!l.repaymentSchedule?.length && (l.dueDate || "").startsWith(monthKey)) {
      sum += Math.max(0, Number(l.remainingAmount ?? l.remainingBalance) || 0);
    }
  }
  return sum;
}

/** Expected receivables from money lent out (inflow). */
export function lendingInflowInMonth(lendings, monthKey, getEffectiveLendingStatus, todayStr) {
  let sum = 0;
  for (const l of lendings || []) {
    if (l.type !== "lent") continue;
    if (getEffectiveLendingStatus(l, todayStr) === "complete") continue;
    for (const row of l.repaymentSchedule || []) {
      if ((row.dueDate || "").startsWith(monthKey) && row.paymentStatus !== "paid") {
        sum += Math.max(0, Number(row.totalPayment) || 0);
      }
    }
  }
  return sum;
}

/** Gross scheduled borrowed repayments in month (before payment status). */
export function lendingScheduledInMonth(lendings, monthKey, getEffectiveLendingStatus, todayStr) {
  let sum = 0;
  for (const l of lendings || []) {
    if (l.type !== "borrowed") continue;
    if (getEffectiveLendingStatus(l, todayStr) === "complete") continue;
    for (const row of l.repaymentSchedule || []) {
      if ((row.dueDate || "").startsWith(monthKey)) {
        sum += Math.max(0, Number(row.totalPayment) || 0);
      }
    }
    if (!l.repaymentSchedule?.length && (l.dueDate || "").startsWith(monthKey)) {
      sum += Math.max(0, Number(l.remainingAmount ?? l.remainingBalance) || 0);
    }
  }
  return sum;
}

/** Payments recorded on borrowed lendings in a calendar month. */
export function lendingPaidInMonth(lendings, monthKey) {
  let sum = 0;
  for (const l of lendings || []) {
    if (l.type !== "borrowed") continue;
    for (const p of l.payments || []) {
      if ((p.date || "").startsWith(monthKey)) {
        sum += Math.max(0, Number(p.amount) || 0);
      }
    }
  }
  return sum;
}

/** Approximate recurring monthly burden from active borrowed lendings. */
export function monthlyBurdenForLending(l, getEffectiveLendingStatus, todayStr) {
  if (l.type !== "borrowed") return 0;
  if (getEffectiveLendingStatus(l, todayStr) === "complete") return 0;
  const rem = Math.max(0, Number(l.remainingAmount ?? l.remainingBalance) || 0);
  if (rem <= 0) return 0;
  if (l.repaymentType === "lumpsum" || l.repaymentFrequency === "lumpsum") return 0;
  return Math.max(0, Number(l.expectedInstallment ?? l.nextDueAmount) || 0);
}

export function totalMonthlyLendingBurden(lendings, getEffectiveLendingStatus, todayStr) {
  return (lendings || []).reduce(
    (s, l) => s + monthlyBurdenForLending(l, getEffectiveLendingStatus, todayStr),
    0,
  );
}
