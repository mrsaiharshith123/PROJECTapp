import { format } from "date-fns";
import { amountDueInMonth, scheduledGrossInMonth } from "../engines/forecastSeries.js";
import { isHistoryBill } from "./billLifecycle.js";
import { todayYmd } from "./dates.js";
import { formatBurdenPercent } from "./formatBurdenPercent.js";

/**
 * Current calendar month summary for the dashboard.
 * Due / Left = still owed; Paid = cash out; burden % uses planned obligations (gross).
 */
export function computeCurrentMonthSummary(commitments, getEffectiveStatusFn, todayStr = todayYmd(), monthlyIncome = 0) {
  const monthKey = format(new Date(`${todayStr}T12:00:00`), "yyyy-MM");
  const monthNum = format(new Date(`${todayStr}T12:00:00`), "MM");
  const monthLabel = format(new Date(`${todayStr}T12:00:00`), "MMMM yyyy");

  let paidThisMonth = 0;
  let scheduledThisMonth = 0;
  let dueThisMonth = 0;

  for (const c of commitments) {
    if (isHistoryBill(c)) {
      for (const p of c.payments || []) {
        if ((p.date || "").startsWith(monthKey)) {
          paidThisMonth += Number(p.amount) || 0;
        }
      }
      continue;
    }

    const eff = getEffectiveStatusFn(c, todayStr);
    if (eff === "paid") {
      for (const p of c.payments || []) {
        if ((p.date || "").startsWith(monthKey)) {
          paidThisMonth += Number(p.amount) || 0;
        }
      }
      continue;
    }

    for (const p of c.payments || []) {
      if ((p.date || "").startsWith(monthKey)) {
        paidThisMonth += Number(p.amount) || 0;
      }
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
