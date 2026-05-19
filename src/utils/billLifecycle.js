import { differenceInCalendarMonths, parseISO } from "date-fns";
import { compareYmd, todayYmd } from "./dates.js";
import { normalizeRepeatType, repeatIntervalMonths } from "../constants/repeatTypes.js";

/** @typedef {"paid" | "upnext" | "pending" | "overdue"} BillEffectiveStatus */

export const BILL_STATUS_UI = {
  paid: { label: "Paid", classes: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" },
  upnext: { label: "Up next", classes: "bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800" },
  pending: { label: "Due", classes: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200" },
  overdue: { label: "Overdue", classes: "bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800" },
};

/**
 * Active = still on the main bills list (uses effective status, not stored status alone).
 * @param {object} c
 * @param {((bill: object, today?: string) => string)=} getEffectiveStatusFn
 * @param {string} [todayStr]
 */
export function isActiveBill(c, getEffectiveStatusFn, todayStr = todayYmd()) {
  if (isHistoryBill(c, getEffectiveStatusFn, todayStr)) return false;
  if (typeof getEffectiveStatusFn === "function") {
    const eff = getEffectiveStatusFn(c, todayStr);
    if (eff === "paid" && normalizeRepeatType(c.repeatType) !== "none") {
      return true;
    }
    return eff !== "paid";
  }
  return c.status !== "paid";
}

/**
 * History = contract ended by calendar, or a fully closed one-off bill.
 * Recurring bills stay active while ongoing (paid this month still shows on active list as Paid).
 */
export function isHistoryBill(c, getEffectiveStatusFn, todayStr = todayYmd()) {
  if (c.endDate && compareYmd(todayStr, c.endDate) > 0) return true;

  const rt = normalizeRepeatType(c.repeatType);
  if (rt !== "none") {
    return false;
  }

  const remaining = Math.max(0, Number(c.remainingAmount ?? 0));
  const eff =
    typeof getEffectiveStatusFn === "function"
      ? getEffectiveStatusFn(c, todayStr)
      : c.status === "paid"
        ? "paid"
        : "pending";

  return eff === "paid" && remaining <= 0;
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

/** Group key for summing payments across rolled recurring / chit rows. */
export function commitmentSeriesKey(c) {
  const profile = String(c.profileId || "default");
  const cat = String(c.category || "Other");
  const name = String(c.name || "")
    .trim()
    .toLowerCase();
  if (cat === "Chit Fund" && Number(c.chitValue) > 0) {
    return `${profile}::chit::${Number(c.chitValue)}::${Math.floor(Number(c.chitMonths) || 0)}::${name}`;
  }
  return `${profile}::${cat}::${name}`;
}
