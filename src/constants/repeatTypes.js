import { differenceInCalendarMonths, parseISO } from "date-fns";
import { compareYmd, todayYmd } from "../utils/dates.js";

export const REPEAT_OPTIONS = [
  { id: "none", label: "Does not repeat", months: 0 },
  { id: "monthly", label: "Every month", months: 1 },
  { id: "bimonthly", label: "Every 2 months", months: 2 },
  { id: "quarterly", label: "Every 3 months", months: 3 },
  { id: "every4months", label: "Every 4 months", months: 4 },
  { id: "yearly", label: "Every year", months: 12 },
];

const VALID_IDS = new Set(REPEAT_OPTIONS.map((r) => r.id));

export function normalizeRepeatType(raw) {
  const s = String(raw || "none");
  if (VALID_IDS.has(s)) return s;
  if (s === "every2months") return "bimonthly";
  if (s === "every3months") return "quarterly";
  return "none";
}

export function repeatIntervalMonths(repeatType) {
  const id = normalizeRepeatType(repeatType);
  return REPEAT_OPTIONS.find((r) => r.id === id)?.months ?? 0;
}

export function repeatTypeLabel(repeatType) {
  const id = normalizeRepeatType(repeatType);
  return REPEAT_OPTIONS.find((r) => r.id === id)?.label ?? repeatType;
}

/** Months from anchor month (start or due) to target yyyy-MM. */
export function monthsFromAnchorToMonth(anchorYmd, monthKey) {
  if (!anchorYmd || !monthKey) return null;
  try {
    return differenceInCalendarMonths(
      parseISO(`${monthKey}-01T12:00:00`),
      parseISO(`${anchorYmd.slice(0, 7)}-01T12:00:00`)
    );
  } catch {
    return null;
  }
}

/** Sum of payment amounts dated in yyyy-MM. */
export function paymentsInMonth(c, monthKey) {
  let sum = 0;
  for (const p of c.payments || []) {
    if ((p.date || "").startsWith(monthKey)) {
      sum += Math.max(0, Number(p.amount) || 0);
    }
  }
  return sum;
}

/**
 * Calendar schedule only — whether this bill type can fall due in a month (ignores paid state).
 */
export function isScheduledInMonth(c, monthKey, _todayStr = todayYmd()) {
  const monthStart = `${monthKey}-01`;
  const monthEnd = `${monthKey}-28`;

  const endDate = c.endDate || "";
  if (endDate && compareYmd(endDate, monthStart) < 0) {
    return false;
  }

  const start = c.startDate || c.dueDate || "";
  if (start && compareYmd(monthEnd, start) < 0) {
    return false;
  }

  const rt = normalizeRepeatType(c.repeatType);
  if (rt === "none") {
    return (c.dueDate || "").startsWith(monthKey);
  }

  const interval = repeatIntervalMonths(rt);
  if (interval <= 0) return false;

  const anchor = c.startDate || c.dueDate;
  const offset = monthsFromAnchorToMonth(anchor, monthKey);
  if (offset == null || offset < 0) return false;

  if (rt === "yearly") {
    return (c.dueDate || anchor || "").slice(5, 7) === monthKey.slice(5, 7);
  }

  return offset % interval === 0;
}

/** Gross obligation for a calendar month (before payments in that month). */
export function grossObligationInMonth(c, monthKey, monthNum, todayStr = todayYmd()) {
  if (!isScheduledInMonth(c, monthKey, todayStr)) return 0;

  const rt = normalizeRepeatType(c.repeatType);
  const amt = Math.max(0, Number(c.amount) || 0);
  if (rt === "none") {
    return Math.max(0, Number(c.remainingAmount ?? amt));
  }
  return amt;
}

/**
 * Whether money is still owed for this calendar month (schedule minus payments dated in month).
 * Does not use global "paid" status so a paid cycle does not hide future recurring months.
 */
export function isBillDueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr) {
  const gross = grossObligationInMonth(c, monthKey, monthNum, todayStr);
  if (gross <= 0) return false;
  const paid = paymentsInMonth(c, monthKey);
  return gross - paid > 0.01;
}
