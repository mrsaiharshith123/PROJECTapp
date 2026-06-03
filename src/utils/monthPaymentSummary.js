import { format } from "date-fns";
import { amountDueInMonth, scheduledGrossInMonth } from "../engines/forecastSeries.js";
import { isHistoryBill } from "./billLifecycle.js";
import { todayYmd } from "./dates.js";

/** Human-readable share of income used by bills (handles tiny values). */
function formatBurdenPercent(amount, monthlyIncome) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const due = Math.max(0, Number(amount) || 0);
  if (income <= 0 || due <= 0) return null;

  const pct = (due / income) * 100;
  if (pct < 0.05) return "<0.1%";
  if (pct < 1) return "<1%";
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.min(100, Math.round(pct))}%`;
}

/**
 * Current calendar month summary for the dashboard.
 * Due / Left = still owed this month; Paid = cash recorded this month.
 */
export function computeCurrentMonthSummary(commitments, getEffectiveStatusFn, todayStr = todayYmd(), monthlyIncome = 0) {
  const monthKey = format(new Date(`${todayStr}T12:00:00`), "yyyy-MM");
  const monthNum = format(new Date(`${todayStr}T12:00:00`), "MM");
  const monthLabel = format(new Date(`${todayStr}T12:00:00`), "MMMM yyyy");

  let paidThisMonth = 0;
  let scheduledThisMonth = 0;
  let dueThisMonth = 0;

  for (const c of commitments) {
    for (const p of c.payments || []) {
      if ((p.date || "").startsWith(monthKey)) {
        paidThisMonth += Math.max(0, Number(p.amount) || 0);
      }
    }

    if (isHistoryBill(c, getEffectiveStatusFn, todayStr)) {
      continue;
    }

    const gross = scheduledGrossInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
    const owed = amountDueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
    scheduledThisMonth += gross;
    dueThisMonth += owed;
  }

  const leftThisMonth = dueThisMonth;
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const freeCash = income > 0 ? income - paidThisMonth : null;
  const duePercentOfIncome = formatBurdenPercent(scheduledThisMonth, income);

  const paidPct =
    scheduledThisMonth > 0
      ? Math.min(100, Math.round((paidThisMonth / scheduledThisMonth) * 100))
      : paidThisMonth > 0
        ? 100
        : 0;

  return {
    monthKey,
    monthLabel,
    paidThisMonth: Math.round(paidThisMonth),
    leftThisMonth: Math.round(leftThisMonth),
    dueThisMonth: Math.round(dueThisMonth),
    scheduledThisMonth: Math.round(scheduledThisMonth),
    freeCash: freeCash != null ? Math.round(freeCash) : null,
    duePercentOfIncome,
    paidPct,
    remainingThisMonth: Math.round(leftThisMonth),
    totalDueThisMonth: Math.round(dueThisMonth),
  };
}
