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
export function buildCashflowForecastSeries(commitments, monthlyIncome, getEffectiveStatusFn, todayStr, months = 12) {
  const income = Math.max(0, monthlyIncome || 0);
  const today = parseISO(`${todayStr}T12:00:00`);
  const rows = [];

  for (let i = 0; i < months; i++) {
    const d = addMonths(today, i);
    const monthKey = format(d, "yyyy-MM");
    const monthNum = format(d, "MM");
    const label = format(d, "MMM yy");

    let due = 0;
    for (const c of commitments) {
      due += amountDueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
    }
    const free = income - due;
    rows.push({
      month: label,
      monthKey,
      due: Math.round(due),
      free: Math.round(free),
      income: Math.round(income),
    });
  }

  return rows;
}
