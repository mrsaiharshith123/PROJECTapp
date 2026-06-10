import { addDays, format, parseISO } from "date-fns";
import { isBillDueOnDate } from "../constants/repeatTypes.js";

/**
 * Salary credit day → upcoming bill dues → projected buffer.
 * @param {{
 *   commitments: object[],
 *   getEffectiveStatus: (c: object) => string,
 *   salaryCreditDay?: number | null,
 *   income?: number,
 *   todayStr: string,
 *   daysAhead?: number,
 * }} input
 */
export function buildPaycheckTimeline(input) {
  const todayStr = input.todayStr;
  const daysAhead = input.daysAhead ?? 45;
  const income = Math.max(0, Number(input.income) || 0);
  const salaryDay =
    input.salaryCreditDay != null
      ? Math.min(28, Math.max(1, Math.floor(Number(input.salaryCreditDay))))
      : null;

  let today;
  try {
    today = parseISO(`${todayStr}T12:00:00`);
  } catch {
    return { salaryDay, days: [], bufferAfterBills: income, totalDueBeforeNextSalary: 0 };
  }

  /** @type {{ date: string, label: string, type: 'salary'|'bill', amount: number, name?: string }[]} */
  const events = [];

  for (let i = 0; i <= daysAhead; i += 1) {
    const d = addDays(today, i);
    const date = format(d, "yyyy-MM-dd");
    const dom = d.getDate();

    if (salaryDay && dom === salaryDay) {
      events.push({ date, label: format(d, "d MMM"), type: "salary", amount: income });
    }

    for (const c of input.commitments || []) {
      if (input.getEffectiveStatus(c) === "paid") continue;
      if (!isBillDueOnDate(c, date, input.getEffectiveStatus)) continue;
      const amt = Math.max(0, Number(c.amount) || 0);
      events.push({
        date,
        label: format(d, "d MMM"),
        type: "bill",
        amount: amt,
        name: String(c.name || c.category || "Bill"),
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || (a.type === "salary" ? -1 : 1));

  let nextSalaryIdx = events.findIndex((e) => e.type === "salary" && e.date >= todayStr);
  if (nextSalaryIdx < 0) nextSalaryIdx = events.findIndex((e) => e.type === "salary");

  const window =
    nextSalaryIdx >= 0
      ? events.slice(nextSalaryIdx, nextSalaryIdx + 20)
      : events.slice(0, 20);

  const salaryEvent = window.find((e) => e.type === "salary");
  const billsAfterSalary = salaryEvent
    ? window.filter((e) => e.type === "bill" && e.date >= salaryEvent.date)
    : window.filter((e) => e.type === "bill");

  const totalDue = billsAfterSalary.reduce((s, e) => s + e.amount, 0);
  const bufferAfterBills = salaryEvent ? Math.max(0, salaryEvent.amount - totalDue) : Math.max(0, income - totalDue);

  return {
    salaryDay,
    days: window,
    bufferAfterBills: Math.round(bufferAfterBills),
    totalDueBeforeNextSalary: Math.round(totalDue),
    hasSalaryDay: Boolean(salaryDay),
  };
}
