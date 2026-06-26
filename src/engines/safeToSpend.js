import { parseISO } from "date-fns";

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
    return { daily: 0, daysUntilSalary: null, bufferAfterBills: buffer };
  }

  let today;
  try {
    today = parseISO(`${todayStr}T12:00:00`);
  } catch {
    return { daily: 0, daysUntilSalary: null, bufferAfterBills: buffer };
  }

  const dom = today.getDate();
  let daysUntil = salaryDay - dom;
  if (daysUntil <= 0) daysUntil += 28;

  const dailyRaw = daysUntil > 0 ? Math.round(buffer / daysUntil) : buffer;
  const daily = Number.isFinite(dailyRaw) ? Math.max(0, dailyRaw) : 0;
  return { daily, daysUntilSalary: daysUntil, bufferAfterBills: buffer };
}
