import { format } from "date-fns";
import { amountDueInMonth, scheduledGrossInMonth } from "../engines/forecastSeries.js";
import {
  lendingDueInMonth,
  lendingPaidInMonth,
  lendingScheduledInMonth,
} from "../engines/lendingMonthCash.js";
import { isHistoryBill } from "./billLifecycle.js";
import { todayYmd } from "./dates.js";
import { sumDailySpendsInRange, filterDailySpendsByProfile } from "./dailySpends.js";
import { computeDailySpendGuidance } from "./dailySpendGuidance.js";

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
 * Due / Left = still owed this month (bills + lending); Paid = cash recorded this month.
 * Free cash subtracts bill payments, lending payments, and logged daily spends.
 *
 * @param {object} [options]
 * @param {object[]} [options.dailySpends]
 * @param {object[]} [options.lendings]
 * @param {(l: object, todayStr?: string) => string} [options.getEffectiveLendingStatus]
 * @param {string} [options.profileId]
 */
export function computeCurrentMonthSummary(
  commitments,
  getEffectiveStatusFn,
  todayStr = todayYmd(),
  monthlyIncome = 0,
  options = {},
) {
  const { dailySpends = [], lendings = [], getEffectiveLendingStatus, profileId = "default" } = options;
  const monthKey = format(new Date(`${todayStr}T12:00:00`), "yyyy-MM");
  const monthNum = format(new Date(`${todayStr}T12:00:00`), "MM");
  const monthLabel = format(new Date(`${todayStr}T12:00:00`), "MMMM yyyy");
  const monthStart = `${monthKey}-01`;

  let billsPaidThisMonth = 0;
  let billsScheduledThisMonth = 0;
  let billsDueThisMonth = 0;

  for (const c of commitments) {
    for (const p of c.payments || []) {
      if ((p.date || "").startsWith(monthKey)) {
        billsPaidThisMonth += Math.max(0, Number(p.amount) || 0);
      }
    }

    if (isHistoryBill(c, getEffectiveStatusFn, todayStr)) {
      continue;
    }

    const gross = scheduledGrossInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
    const owed = amountDueInMonth(c, monthKey, monthNum, getEffectiveStatusFn, todayStr);
    billsScheduledThisMonth += gross;
    billsDueThisMonth += owed;
  }

  const lendingDueThisMonth =
    getEffectiveLendingStatus && lendings.length > 0
      ? lendingDueInMonth(lendings, monthKey, getEffectiveLendingStatus, todayStr)
      : 0;
  const lendingPaidThisMonth = lendings.length > 0 ? lendingPaidInMonth(lendings, monthKey) : 0;
  const lendingScheduledThisMonth =
    getEffectiveLendingStatus && lendings.length > 0
      ? lendingScheduledInMonth(lendings, monthKey, getEffectiveLendingStatus, todayStr)
      : 0;

  const profileSpends = filterDailySpendsByProfile(dailySpends, profileId);
  const spentThisMonth = sumDailySpendsInRange(profileSpends, monthStart, todayStr);

  const paidThisMonth = billsPaidThisMonth + lendingPaidThisMonth;
  const scheduledThisMonth = billsScheduledThisMonth + lendingScheduledThisMonth;
  const dueThisMonth = billsDueThisMonth + lendingDueThisMonth;
  const leftThisMonth = dueThisMonth;
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const freeCash =
    income > 0 ? income - paidThisMonth - spentThisMonth : null;
  const duePercentOfIncome = formatBurdenPercent(scheduledThisMonth, income);

  const spendGuidance = computeDailySpendGuidance({
    income,
    dueThisMonth,
    spentThisMonth,
    paidThisMonth,
    todayStr,
    scheduledThisMonth,
  });

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
    billsDueThisMonth: Math.round(billsDueThisMonth),
    billsPaidThisMonth: Math.round(billsPaidThisMonth),
    lendingDueThisMonth: Math.round(lendingDueThisMonth),
    lendingPaidThisMonth: Math.round(lendingPaidThisMonth),
    spentThisMonth: Math.round(spentThisMonth),
    spendGuidance,
  };
}
