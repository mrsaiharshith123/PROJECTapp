import { addMonths, format, parseISO } from "date-fns";
/**
 * Due amount for a commitment falling in a given calendar month (YYYY-MM).
 */
function dueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr) {
  const eff = getEffectiveStatusFn(c, todayStr);
  if (eff === "paid") return 0;
  const amt = Number(c.amount) || 0;
  const rt = c.repeatType || "none";
  if (rt === "monthly") return amt;
  if (rt === "yearly") {
    const due = c.dueDate || "";
    return due.slice(5, 7) === monthNum ? amt : 0;
  }
  const due = c.dueDate || "";
  return due.startsWith(monthKey) ? Math.max(0, Number(c.remainingAmount ?? amt)) : 0;
}

/**
 * 6–12 month cashflow forecast: obligations due per month vs income.
 * @param {number} months 6–12
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
      due += dueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
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
