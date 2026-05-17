import { addMonths, format, parseISO } from "date-fns";
import { compareYmd, todayYmd } from "./dates.js";
import { normalizeRepeatType, repeatIntervalMonths } from "../constants/repeatTypes.js";

/** End date: same month/day as start, year = current calendar year (≥ start). */
export function defaultEndDateFromStart(startYmd, refYmd = todayYmd()) {
  if (!startYmd || startYmd.length < 10) return "";
  const monthDay = startYmd.slice(5);
  const year = refYmd.slice(0, 4);
  let end = `${year}-${monthDay}`;
  if (compareYmd(end, startYmd) < 0) {
    end = `${Number(year) + 1}-${monthDay}`;
  }
  return end;
}

/** Next payment due on or after today, anchored to start date + repeat. */
export function defaultDueDateFromStart(startYmd, repeatType, refYmd = todayYmd()) {
  if (!startYmd || startYmd.length < 10) return refYmd;
  const rt = normalizeRepeatType(repeatType);
  if (rt === "none") {
    return compareYmd(startYmd, refYmd) >= 0 ? startYmd : refYmd;
  }
  const interval = repeatIntervalMonths(rt) || 1;
  try {
    let cursor = parseISO(`${startYmd}T12:00:00`);
    const limit = 600;
    for (let i = 0; i < limit; i++) {
      const ymd = format(cursor, "yyyy-MM-dd");
      if (compareYmd(ymd, refYmd) >= 0) return ymd;
      cursor = addMonths(cursor, interval);
    }
    return format(cursor, "yyyy-MM-dd");
  } catch {
    return startYmd;
  }
}

export function isAutoDerivedDue(prevStart, prevRepeat, prevDue, todayStr = todayYmd()) {
  if (!prevDue) return true;
  if (!prevStart) return false;
  return prevDue === defaultDueDateFromStart(prevStart, prevRepeat, todayStr);
}

export function isAutoDerivedEnd(prevStart, prevEnd, todayStr = todayYmd()) {
  if (!prevEnd) return true;
  if (!prevStart) return false;
  return prevEnd === defaultEndDateFromStart(prevStart, todayStr);
}

/** Apply start-date change: refresh auto due/end, never copy start → due blindly. */
export function applyBillStartDateChange(form, startDate, todayStr = todayYmd()) {
  const next = { ...form, startDate };
  if (isAutoDerivedDue(form.startDate, form.repeatType, form.dueDate, todayStr) || !form.dueDate) {
    next.dueDate = defaultDueDateFromStart(startDate, form.repeatType, todayStr);
  }
  if (isAutoDerivedEnd(form.startDate, form.endDate, todayStr) || !form.endDate) {
    next.endDate = defaultEndDateFromStart(startDate, todayStr);
  }
  return next;
}

export function applyBillRepeatChange(form, repeatType, todayStr = todayYmd()) {
  const next = { ...form, repeatType };
  if (form.startDate && (isAutoDerivedDue(form.startDate, form.repeatType, form.dueDate, todayStr) || !form.dueDate)) {
    next.dueDate = defaultDueDateFromStart(form.startDate, repeatType, todayStr);
  }
  return next;
}
