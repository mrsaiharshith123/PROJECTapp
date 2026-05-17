import { addMonths, format, parseISO } from "date-fns";
import { isBillDueInMonth, normalizeRepeatType } from "../constants/repeatTypes.js";

/**
 * Gross scheduled obligation in a month (before payments this month).
 */
export function scheduledGrossInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr) {
  if (!isBillDueInMonth(c, monthKey, getEffectiveStatusFn, todayStr)) {
    return 0;
  }
  const eff = getEffectiveStatusFn(c, todayStr);
  if (eff === "paid" || eff === "upnext") return 0;

  const rt = normalizeRepeatType(c.repeatType);
  const amt = Number(c.amount) || 0;
  if (rt === "none") {
    return Math.max(0, Number(c.remainingAmount ?? amt));
  }
  return amt;
}

/**
 * Still owed this calendar month for one bill (scheduled minus payments dated this month).
 */
export function amountDueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr) {
  const gross = scheduledGrossInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
  if (gross <= 0) return 0;

  let paidInMonth = 0;
  for (const p of c.payments || []) {
    if ((p.date || "").startsWith(monthKey)) {
      paidInMonth += Number(p.amount) || 0;
    }
  }
  return Math.max(0, gross - paidInMonth);
}

/**
 * 6–12 month cashflow forecast: obligations due per month vs income.
 */
function lendingDueInMonth(lendings, monthKey, getEffectiveLendingStatus, todayStr) {
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
      sum += Math.max(0, Number(l.remainingAmount) || 0);
    }
  }
  return sum;
}

function lendingInflowInMonth(lendings, monthKey, getEffectiveLendingStatus, todayStr) {
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

/**
 * 6–12 month cashflow forecast: bill obligations + lending outflow vs income + expected receivables.
 */
export function buildCashflowForecastSeries(
  commitments,
  monthlyIncome,
  getEffectiveStatusFn,
  todayStr,
  months = 12,
  options = {}
) {
  const { lendings = [], getEffectiveLendingStatus } = options;
  const income = Math.max(0, monthlyIncome || 0);
  const today = parseISO(`${todayStr}T12:00:00`);
  const rows = [];

  for (let i = 0; i < months; i++) {
    const d = addMonths(today, i);
    const monthKey = format(d, "yyyy-MM");
    const monthNum = format(d, "MM");
    const label = format(d, "MMM yy");

    let billDue = 0;
    for (const c of commitments) {
      billDue += amountDueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
    }
    const lendOut = getEffectiveLendingStatus
      ? lendingDueInMonth(lendings, monthKey, getEffectiveLendingStatus, todayStr)
      : 0;
    const inflow = getEffectiveLendingStatus
      ? lendingInflowInMonth(lendings, monthKey, getEffectiveLendingStatus, todayStr)
      : 0;
    const due = billDue + lendOut;
    const effectiveIncome = income + inflow;
    const free = effectiveIncome - due;
    rows.push({
      month: label,
      monthKey,
      due: Math.round(due),
      free: Math.round(free),
      income: Math.round(effectiveIncome),
      lendingInflow: Math.round(inflow),
      lendingOutflow: Math.round(lendOut),
      billsDue: Math.round(billDue),
    });
  }

  return rows;
}
