import { format } from "date-fns";

/** Local calendar YYYY-MM-DD for today */
export function todayYmd() {
  return format(new Date(), "yyyy-MM-dd");
}

/** Compare two YYYY-MM-DD strings; returns negative if a < b */
export function compareYmd(a, b) {
  if (!a || !b) return 0;
  return a.localeCompare(b);
}

/**
 * Days from today until a due date string (YYYY-MM-DD).
 * Negative = overdue. 0 = due today.
 * @param {string} dueDate
 * @param {string} todayStr  YYYY-MM-DD
 * @returns {number}
 */
export function daysUntil(dueDate, todayStr) {
  if (!dueDate || !todayStr) return 0;
  const due = new Date(dueDate);
  const today = new Date(todayStr);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
