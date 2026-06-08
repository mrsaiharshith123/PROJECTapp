import { format, subMonths, endOfMonth, parseISO } from "date-fns";
import {
  sumDailySpendsInRange,
  dailySpendByLifeCategory,
  dailySpendByMerchant,
} from "./dailySpends.js";
import { getTransactionLifeCategoryMeta } from "../constants/transactionCategories.js";

/** Bill payments + variable logs per calendar month (last N months). */
export function buildPaymentsWithVariableSeries(commitments, dailySpends = [], monthsBack = 12) {
  const rows = [];
  const today = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = subMonths(today, i);
    const monthKey = format(d, "yyyy-MM");
    const label = format(d, "MMM");
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
    rows.push({
      month: label,
      monthKey,
      billsPaid: Math.round(billsPaid),
      variableLogged: Math.round(variableLogged),
      amount: Math.round(billsPaid + variableLogged),
    });
  }
  return rows;
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
