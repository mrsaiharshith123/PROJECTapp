import { addMonths, format, parseISO } from "date-fns";
import {
  isBillDueInMonth,
  grossObligationInMonth,
  paymentsInMonth,
} from "../constants/repeatTypes.js";
import { lendingDueInMonth, lendingInflowInMonth } from "./lendingMonthCash.js";

export { lendingDueInMonth, lendingInflowInMonth } from "./lendingMonthCash.js";

/**
 * Gross scheduled obligation in a month (before payments this month).
 */
export function scheduledGrossInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr) {
  return grossObligationInMonth(c, monthKey, monthNum, todayStr);
}

/**
 * Still owed this calendar month for one bill (scheduled minus payments dated this month).
 */
export function amountDueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr) {
  const gross = scheduledGrossInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
  if (gross <= 0) return 0;
  const paidInMonth = paymentsInMonth(c, monthKey);
  return Math.max(0, gross - paidInMonth);
}

/**
 * 6–12 month cashflow forecast: bill obligations + lending outflow vs income + expected receivables.
 */
/** Money outlook window: 3 months back, current month, 3 months ahead (7 bars). */
export const MONEY_OUTLOOK_WINDOW = { months: 7, startOffset: -3 };

/**
 * @param {{ lendings?: object[], getEffectiveLendingStatus?: (l: object, todayStr?: string) => string, startOffset?: number }} [options]
 */
export function buildCashflowForecastSeries(
  commitments,
  monthlyIncome,
  getEffectiveStatusFn,
  todayStr,
  months = 12,
  options = {}
) {
  const { lendings = [], getEffectiveLendingStatus, startOffset = 0 } = options;
  const income = Math.max(0, monthlyIncome || 0);
  const today = parseISO(`${todayStr}T12:00:00`);
  const rows = [];

  for (let i = startOffset; i < startOffset + months; i++) {
    const d = addMonths(today, i);
    const monthKey = format(d, "yyyy-MM");
    const monthNum = format(d, "MM");
    const label = format(d, "MMM yy");

    let billDue = 0;
    for (const c of commitments) {
      if (isBillDueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr)) {
        billDue += amountDueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
      }
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
