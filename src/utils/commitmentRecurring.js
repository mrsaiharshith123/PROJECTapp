import { addMonths, addYears, parseISO, format } from "date-fns";
import { todayYmd } from "./dates.js";
import { getEffectiveStatus } from "./commitmentStatus.js";

/**
 * After a cycle is fully paid, return the paid row and optionally a new pending row for the next cycle.
 * @param {object} c commitment with remainingAmount === 0
 * @param {number} [newId] id for the next cycle row
 * @returns {{ paidRow: object, nextCycle: object | null }}
 */
export function advanceRecurringCommitment(c, newId = Date.now()) {
  const remaining = Number(c.remainingAmount ?? 0);
  const repeatType = c.repeatType || "none";
  const amount = Math.max(0, Number(c.amount) || 0);
  const now = Date.now();

  if (remaining > 0) {
    return { paidRow: c, nextCycle: null };
  }

  if (repeatType === "none") {
    return {
      paidRow: {
        ...c,
        remainingAmount: 0,
        status: "paid",
        updatedAt: now,
      },
      nextCycle: null,
    };
  }

  const paidRow = {
    ...c,
    remainingAmount: 0,
    status: "paid",
    updatedAt: now,
  };

  let nextDue = c.dueDate;
  try {
    const base = parseISO(`${c.dueDate}T12:00:00`);
    const nextDate = repeatType === "yearly" ? addYears(base, 1) : addMonths(base, 1);
    nextDue = format(nextDate, "yyyy-MM-dd");
  } catch {
    /* keep nextDue */
  }

  const rolled = {
    ...c,
    id: newId,
    dueDate: nextDue,
    remainingAmount: amount,
    payments: [],
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const todayStr = todayYmd();
  const eff = getEffectiveStatus(rolled, todayStr);
  const nextCycle = {
    ...rolled,
    status: eff === "overdue" ? "overdue" : "pending",
  };

  return { paidRow, nextCycle };
}

/**
 * @deprecated Use advanceRecurringCommitment for new-row behavior.
 * Kept for callers that expect in-place update on one-off paid only.
 */
export function maybeAdvanceRecurringCycle(c) {
  const { paidRow, nextCycle } = advanceRecurringCommitment(c, c.id);
  if (nextCycle) return paidRow;
  return paidRow;
}
