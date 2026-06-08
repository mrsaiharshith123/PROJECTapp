import { format, parseISO } from "date-fns";
import { normalizeRepeatType } from "../constants/repeatTypes.js";
import { sumDailySpendsInRange, filterDailySpendsByProfile } from "../utils/dailySpends.js";

function monthlyWeight(c, getEffectiveStatus) {
  if (getEffectiveStatus(c) === "paid") return 0;
  const amt = Number(c.amount) || 0;
  const rt = normalizeRepeatType(c.repeatType);
  if (rt === "yearly") return amt / 12;
  if (rt === "quarterly") return amt / 3;
  if (rt === "bimonthly") return amt / 2;
  if (rt === "every4months") return amt / 4;
  if (rt === "monthly") return amt;
  return Math.max(0, Number(c.remainingAmount ?? amt));
}

/**
 * Salary → recurring bills → variable logged spend → free cash.
 * @param {{ dailySpends?: object[], todayStr?: string, profileId?: string }} [options]
 */
export function computeSalaryBreakdown(commitments, income, getEffectiveStatus, options = {}) {
  const { dailySpends = [], todayStr = "", profileId = "default" } = options;
  const inc = Math.max(0, income || 0);
  let recurringMonthly = 0;

  for (const c of commitments) {
    recurringMonthly += monthlyWeight(c, getEffectiveStatus);
  }

  let loggedSpendThisMonth = 0;
  if (todayStr) {
    const monthKey = format(parseISO(`${todayStr}T12:00:00`), "yyyy-MM");
    const profileSpends = filterDailySpendsByProfile(dailySpends, profileId);
    loggedSpendThisMonth = sumDailySpendsInRange(profileSpends, `${monthKey}-01`, todayStr);
  }

  const total = recurringMonthly + loggedSpendThisMonth;
  const free = inc - total;
  const committedPercent = inc > 0 ? Math.round((total / inc) * 100) : null;
  const safeSpend = free > 0 ? Math.round(free * 0.7) : 0;

  return {
    income: inc,
    recurringMonthly: Math.round(recurringMonthly),
    /** @deprecated use recurringMonthly — kept for callers */
    fixedMonthly: Math.round(recurringMonthly),
    loggedSpendThisMonth: Math.round(loggedSpendThisMonth),
    /** Variable = logged daily spend only */
    variableMonthly: Math.round(loggedSpendThisMonth),
    variableRecurring: 0,
    totalCommitted: Math.round(total),
    freeCash: Math.round(free),
    committedPercent,
    safeSpending: safeSpend,
    pressureImpact: committedPercent != null && committedPercent > 60 ? "high" : committedPercent > 45 ? "moderate" : "low",
  };
}
