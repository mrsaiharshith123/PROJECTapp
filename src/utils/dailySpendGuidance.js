import { parseISO, getDaysInMonth, getDate } from "date-fns";

/**
 * Suggested daily spend caps for the rest of the month given bills, lending, and logged spends.
 * @param {object} input
 * @returns {null | {
 *   daysLeft: number,
 *   billsPressurePercent: number,
 *   dailyLifestyleCap: number,
 *   dailyTotalCap: number,
 *   runway: number,
 *   isTight: boolean,
 * }}
 */
export function computeDailySpendGuidance({
  income = 0,
  dueThisMonth = 0,
  spentThisMonth = 0,
  paidThisMonth = 0,
  todayStr,
  scheduledThisMonth = 0,
}) {
  const inc = Math.max(0, Number(income) || 0);
  if (inc <= 0 || !todayStr) return null;

  const today = parseISO(`${todayStr}T12:00:00`);
  const daysInMonth = getDaysInMonth(today);
  const dayOfMonth = getDate(today);
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1);

  const scheduled = Math.max(0, Number(scheduledThisMonth) || 0);
  const billsPressure = scheduled / inc;
  const runway = inc - Math.max(0, paidThisMonth) - Math.max(0, spentThisMonth) - Math.max(0, dueThisMonth);

  const lifestyleShare = billsPressure >= 0.55 ? 0.15 : billsPressure >= 0.4 ? 0.22 : 0.3;
  const lifestylePool = Math.max(0, Math.min(runway, inc * lifestyleShare));
  const dailyLifestyleCap = Math.round(lifestylePool / daysLeft);
  const dailyTotalCap = Math.round(Math.max(0, runway) / daysLeft);

  return {
    daysLeft,
    billsPressurePercent: Math.round(billsPressure * 100),
    dailyLifestyleCap,
    dailyTotalCap,
    runway: Math.round(runway),
    isTight: billsPressure >= 0.55 || runway < inc * 0.1,
  };
}
