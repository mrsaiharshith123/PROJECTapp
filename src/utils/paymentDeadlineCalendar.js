import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  parseISO,
  isToday,
} from "date-fns";

/**
 * @param {object[]} commitments
 * @param {object[]} lendings
 * @param {(c: object) => string} getEffectiveStatus
 * @param {(l: object) => string} getEffectiveLendingStatus
 * @returns {Record<string, { id: string|number, name: string, amount: number, status: string, kind: 'bill'|'lending' }[]>}
 */
export function collectPaymentDeadlines(
  commitments,
  lendings,
  getEffectiveStatus,
  getEffectiveLendingStatus
) {
  /** @type {Record<string, object[]>} */
  const byDate = {};

  const add = (dateStr, item) => {
    if (!dateStr || String(dateStr).length < 10) return;
    const key = String(dateStr).slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(item);
  };

  for (const c of commitments || []) {
    const status = getEffectiveStatus(c);
    if (status === "paid" || status === "skipped") continue;
    add(c.dueDate, {
      id: c.id,
      name: c.name || "Bill",
      amount: Math.max(0, Number(c.remainingAmount ?? c.amount) || 0),
      status,
      kind: "bill",
    });
  }

  for (const l of lendings || []) {
    const status = getEffectiveLendingStatus(l);
    if (status === "complete") continue;
    const due = l.nextDueDate || l.dueDate;
    add(due, {
      id: l.id,
      name: l.personName || l.borrowerFullName || "Loan",
      amount: Math.max(0, Number(l.nextDueAmount ?? l.remainingAmount ?? l.amount) || 0),
      status,
      kind: "lending",
    });
  }

  return byDate;
}

/** @param {Date} monthDate */
export function buildMonthCalendarGrid(monthDate) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start, end });
  const leadingEmpty = getDay(start);
  return {
    monthKey: format(monthDate, "yyyy-MM"),
    monthLabel: format(monthDate, "MMMM yyyy"),
    leadingEmpty,
    days: days.map((d) => ({
      date: d,
      ymd: format(d, "yyyy-MM-dd"),
      dayNum: d.getDate(),
      isToday: isToday(d),
    })),
  };
}

/** @param {string} ymd */
export function formatDeadlineHeading(ymd) {
  try {
    return format(parseISO(`${ymd}T12:00:00`), "EEEE, d MMMM");
  } catch {
    return ymd;
  }
}
