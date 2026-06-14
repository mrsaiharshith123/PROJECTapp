import { format, subMonths, addMonths, endOfMonth, parseISO } from "date-fns";
import {
  sumDailySpendsInRange,
  dailySpendByLifeCategory,
  dailySpendByMerchant,
} from "./dailySpends.js";
import { getTransactionLifeCategoryMeta } from "../constants/transactionCategories.js";

/** Bill payments + variable logs per calendar month (last N months). */
export function buildPaymentsWithVariableSeries(commitments, dailySpends = [], monthsBack = 7) {
  const rows = [];
  const today = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = subMonths(today, i);
    rows.push(buildPaymentMonthRow(commitments, dailySpends, d));
  }
  return rows;
}

/**
 * Centered outlook window: e.g. 3 months back, current, 3 ahead (7 bars).
 * @param {{ months?: number, startOffset?: number }} window
 */
export function buildPaymentsOutlookSeries(
  commitments,
  dailySpends = [],
  window = { months: 7, startOffset: -3 },
) {
  const months = window.months ?? 7;
  const startOffset = window.startOffset ?? -3;
  const today = new Date();
  const rows = [];
  for (let i = startOffset; i < startOffset + months; i++) {
    const d = addMonths(today, i);
    rows.push(buildPaymentMonthRow(commitments, dailySpends, d));
  }
  return rows;
}

function buildPaymentMonthRow(commitments, dailySpends, d) {
  const monthKey = format(d, "yyyy-MM");
  const label = format(d, "MMM yy");
  const end = format(endOfMonth(d), "yyyy-MM-dd");
  const start = `${monthKey}-01`;

  let billsPaid = 0;
  for (const c of commitments) {
    for (const p of c.payments || []) {
      if ((p.date || "").startsWith(monthKey)) {
        billsPaid += Math.max(0, Number(p.amount) || 0);
      }
    }
  }
  const variableLogged = sumDailySpendsInRange(dailySpends, start, end);
  return {
    month: label,
    monthKey,
    billsPaid: Math.round(billsPaid),
    variableLogged: Math.round(variableLogged),
    amount: Math.round(billsPaid + variableLogged),
  };
}

/** Attach logged variable spend to forecast rows (historical months only). */
export function attachVariableSpendToForecast(forecastRows, dailySpends = []) {
  return (forecastRows || []).map((row) => {
    const monthKey = row.monthKey;
    if (!monthKey) return row;
    const end = format(endOfMonth(parseISO(`${monthKey}-01T12:00:00`)), "yyyy-MM-dd");
    const variableSpent = sumDailySpendsInRange(dailySpends, `${monthKey}-01`, end);
    const due = Math.max(0, Number(row.due) || 0);
    const income = Math.max(0, Number(row.income) || 0);
    const free = income - due - variableSpent;
    return {
      ...row,
      variableSpent: Math.round(variableSpent),
      free: Math.round(free),
    };
  });
}

/** Drill-down breakdown for one month's variable logs. */
export function variableSpendDrilldown(dailySpends, monthKey) {
  if (!monthKey) {
    return { categories: [], merchants: [], entries: [], total: 0 };
  }
  const end = format(endOfMonth(parseISO(`${monthKey}-01T12:00:00`)), "yyyy-MM-dd");
  const start = `${monthKey}-01`;
  const total = sumDailySpendsInRange(dailySpends, start, end);

  const categories = dailySpendByLifeCategory(dailySpends, start, end).map(({ lifeCategory, amount }) => ({
    name: getTransactionLifeCategoryMeta(lifeCategory).label,
    amount,
    lifeCategory,
  }));

  const merchants = dailySpendByMerchant(dailySpends, start, end).slice(0, 8).map((m) => ({
    name: m.label,
    amount: m.amount,
    count: m.count,
  }));

  const entries = (dailySpends || [])
    .filter((s) => s.date >= start && s.date <= end)
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, 10)
    .map((s) => ({
      id: s.id,
      label: s.label,
      amount: s.amount,
      date: s.date,
      lifeCategory: s.lifeCategory,
    }));

  return { categories, merchants, entries, total: Math.round(total) };
}
