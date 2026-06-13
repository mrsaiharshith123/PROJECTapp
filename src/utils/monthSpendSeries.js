import { format, parseISO, eachDayOfInterval, getDaysInMonth, getDate } from "date-fns";
import { filterDailySpendsByProfile } from "./dailySpends.js";

/**
 * Cumulative bills-paid + variable spend by day for the current month (home sparkline).
 * @param {object[]} commitments
 * @param {object[]} dailySpends
 * @param {string} todayStr yyyy-MM-dd
 * @param {string} [profileId]
 */
export function buildMonthCumulativeSpendSeries(commitments, dailySpends, todayStr, profileId = "default") {
  const today = parseISO(`${todayStr}T12:00:00`);
  const monthKey = format(today, "yyyy-MM");
  const monthStart = parseISO(`${monthKey}-01T12:00:00`);
  const days = eachDayOfInterval({ start: monthStart, end: today });

  const byDay = new Map();
  for (const d of days) {
    byDay.set(format(d, "yyyy-MM-dd"), 0);
  }

  for (const c of commitments || []) {
    for (const p of c.payments || []) {
      const date = p.date || "";
      if (!date.startsWith(monthKey) || !byDay.has(date)) continue;
      byDay.set(date, (byDay.get(date) || 0) + Math.max(0, Number(p.amount) || 0));
    }
  }

  const profileSpends = filterDailySpendsByProfile(dailySpends || [], profileId);
  for (const s of profileSpends) {
    const date = s.date || "";
    if (!date.startsWith(monthKey) || !byDay.has(date)) continue;
    byDay.set(date, (byDay.get(date) || 0) + Math.max(0, Number(s.amount) || 0));
  }

  let cumulative = 0;
  return days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    cumulative += byDay.get(key) || 0;
    const dayNum = getDate(d);
    const isMonthEdge = dayNum === 1 || key === todayStr;
    return {
      day: dayNum,
      dayKey: key,
      label: isMonthEdge ? format(d, "d MMM") : String(dayNum),
      value: Math.round(cumulative),
    };
  });
}

/**
 * Project month-end spend pace from current cumulative (flat line to month end).
 * @param {{ day: number, value: number }[]} series
 * @param {number} monthlyIncome
 * @param {string} todayStr
 */
export function extendSpendSeriesToMonthEnd(series, monthlyIncome, todayStr) {
  if (!series.length) return [];
  const today = parseISO(`${todayStr}T12:00:00`);
  const daysInMonth = getDaysInMonth(today);
  const last = series[series.length - 1];
  const dayOfMonth = getDate(today);
  const pace =
    dayOfMonth > 0 ? (last.value / dayOfMonth) * daysInMonth : last.value;
  const cap = Math.max(0, Number(monthlyIncome) || 0);

  const out = [...series];
  if (dayOfMonth < daysInMonth && cap > 0) {
    out.push({ day: daysInMonth, value: Math.round(Math.min(cap * 1.15, pace)) });
  }
  return out;
}
