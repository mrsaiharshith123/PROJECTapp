import { addDays, format, parseISO } from "date-fns";
import { isBillDueOnDate } from "../constants/repeatTypes.js";

/** @typedef {'salary'|'heavy'|'moderate'|'light'|'free'} DayPressure */

/**
 * 90-day daily cashflow calendar for horizontal UI strip.
 */
export function buildCashflowCalendar({
  commitments = [],
  getEffectiveStatus,
  todayStr,
  salaryCreditDay = null,
  daysAhead = 90,
  income = 0,
}) {
  if (!todayStr) return { days: [], summary: {} };

  const today = parseISO(`${todayStr}T12:00:00`);
  const inc = Math.max(0, Number(income) || 0);
  const salaryDay = salaryCreditDay != null ? Math.min(28, Math.max(1, Number(salaryCreditDay))) : null;

  /** @type {{ date: string, label: string, amount: number, pressure: DayPressure, items: object[] }[]} */
  const days = [];

  for (let i = 0; i < daysAhead; i++) {
    const d = addDays(today, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const dayOfMonth = d.getDate();
    let amount = 0;
    const items = [];

    for (const c of commitments) {
      if (!isBillDueOnDate(c, dateStr, getEffectiveStatus, todayStr)) continue;
      const amt = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
      amount += amt;
      items.push({ name: c.name, category: c.category, amount: Math.round(amt) });
    }

    let pressure = "free";
    if (salaryDay != null && dayOfMonth === salaryDay) {
      pressure = "salary";
    } else if (amount > 0) {
      const ratio = inc > 0 ? amount / inc : amount / 10000;
      if (ratio >= 0.25) pressure = "heavy";
      else if (ratio >= 0.12) pressure = "moderate";
      else pressure = "light";
    }

    days.push({
      date: dateStr,
      label: format(d, "d MMM"),
      amount: Math.round(amount),
      pressure: /** @type {DayPressure} */ (pressure),
      items,
    });
  }

  const heavyCount = days.filter((d) => d.pressure === "heavy").length;
  const clusterWeeks = findHeavyWeeks(days);

  return {
    days,
    summary: {
      heavyDays: heavyCount,
      salaryDays: days.filter((d) => d.pressure === "salary").length,
      clusterWeeks,
    },
  };
}

function findHeavyWeeks(days) {
  const weeks = [];
  for (let i = 0; i < days.length - 6; i++) {
    const slice = days.slice(i, i + 7);
    const heavy = slice.filter((d) => d.pressure === "heavy" || d.pressure === "moderate").length;
    if (heavy >= 3) {
      weeks.push({ start: slice[0].date, end: slice[6].date, pressureDays: heavy });
    }
  }
  return weeks.slice(0, 5);
}
