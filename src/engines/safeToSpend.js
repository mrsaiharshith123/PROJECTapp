import { parseISO } from "date-fns";
import { safeNum } from "./_guard.js";

/**
 * Daily safe-to-spend until next salary credit after scheduled bills.
 * @param {{
 *   bufferAfterBills: number,
 *   salaryCreditDay?: number | null,
 *   todayStr: string,
 * }} input
 */
export function computeSafeToSpendDaily(input) {
  const buffer = Math.max(0, Number(input.bufferAfterBills) || 0);
  const todayStr = input.todayStr;
  const salaryDay =
    input.salaryCreditDay != null
      ? Math.min(28, Math.max(1, Math.floor(Number(input.salaryCreditDay))))
      : null;

  if (!salaryDay || !todayStr || buffer <= 0) {
    return { daily: 0, daysUntilSalary: null, bufferAfterBills: safeNum(buffer, 0) };
  }

  let today;
  try {
    today = parseISO(`${todayStr}T12:00:00`);
  } catch {
    return { daily: 0, daysUntilSalary: null, bufferAfterBills: safeNum(buffer, 0) };
  }

  const dom = today.getDate();
  let daysUntil = salaryDay - dom;
  if (daysUntil <= 0) daysUntil += 28;

  const daily = daysUntil > 0 ? safeNum(Math.round(buffer / daysUntil), 0) : safeNum(buffer, 0);
  return { daily, daysUntilSalary: daysUntil, bufferAfterBills: safeNum(buffer, 0) };
}
