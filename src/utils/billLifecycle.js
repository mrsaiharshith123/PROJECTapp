import { differenceInCalendarMonths, parseISO } from "date-fns";
import { compareYmd, todayYmd } from "./dates.js";
import { normalizeRepeatType, repeatIntervalMonths } from "../constants/repeatTypes.js";

/** @typedef {"paid" | "upnext" | "pending" | "overdue"} BillEffectiveStatus */

export const BILL_STATUS_UI = {
  paid: { label: "Paid", classes: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" },
  upnext: { label: "Up next", classes: "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800" },
  pending: { label: "Due", classes: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800" },
  overdue: { label: "Overdue", classes: "bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800" },
};

export function isActiveBill(c) {
  return c.status !== "paid";
}

export function isHistoryBill(c) {
  return c.status === "paid";
}

/**
 * Estimated spend from start date through end of last calendar year (excludes current year).
 */
export function estimatePriorSpend(c, todayStr = todayYmd()) {
  const start = c.startDate || c.dueDate || "";
  if (!start) return 0;

  const yearStart = `${todayStr.slice(0, 4)}-01-01`;
  if (compareYmd(start, yearStart) >= 0) return 0;

  const amount = Math.max(0, Number(c.amount) || 0);
  const rt = normalizeRepeatType(c.repeatType);
  const interval = repeatIntervalMonths(rt);
  const endBound = compareYmd(c.endDate || "", yearStart) < 0 ? c.endDate : yearStart;

  if (!endBound || compareYmd(start, endBound) >= 0) return 0;

  try {
    if (interval > 0) {
      const months = differenceInCalendarMonths(parseISO(`${endBound}T12:00:00`), parseISO(`${start}T12:00:00`));
      const count =
        rt === "yearly" ? Math.max(0, Math.floor(months / 12)) : Math.max(0, Math.floor(months / interval));
      return count * amount;
    }
    return amount;
  } catch {
    return 0;
  }
}

export function hasPaymentInYear(c, year) {
  const prefix = `${year}-`;
  return (c.payments || []).some((p) => (p.date || "").startsWith(prefix));
}

export function currentYearPrefix(todayStr = todayYmd()) {
  return todayStr.slice(0, 4);
}
