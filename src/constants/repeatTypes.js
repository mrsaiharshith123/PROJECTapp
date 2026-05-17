import { differenceInCalendarMonths, parseISO } from "date-fns";

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

/**
 * Whether this bill has a payment obligation in the given calendar month.
 */
export function isBillDueInMonth(c, monthKey, getEffectiveStatusFn, todayStr) {
  const eff = getEffectiveStatusFn(c, todayStr);
  if (eff === "paid") return false;

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
