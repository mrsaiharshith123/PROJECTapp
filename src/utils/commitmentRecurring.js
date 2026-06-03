import { addMonths, parseISO, format } from "date-fns";
import { todayYmd } from "./dates.js";
import { getEffectiveStatus } from "./commitmentStatus.js";
import { normalizeRepeatType, repeatIntervalMonths } from "../constants/repeatTypes.js";
import { resolveChitInstallment } from "../engines/chitFund.js";

/**
 * After a cycle is fully paid, return the paid row and optionally a new pending row for the next cycle.
 * @param {object} c commitment with remainingAmount === 0
 * @param {number} [newId] id for the next cycle row
 * @returns {{ paidRow: object, nextCycle: object | null }}
 */
export function advanceRecurringCommitment(c, newId = Date.now()) {
  const remaining = Number(c.remainingAmount ?? 0);
  const repeatType = normalizeRepeatType(c.repeatType);
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

  const isChit =
    c.category === "Chit Fund" &&
    Number(c.chitValue) > 0 &&
    Number(c.chitMonths) > 0 &&
    !c.chitTaken;

  if (isChit) {
    const N = Math.floor(Number(c.chitMonths));
    const nextMonth = Math.floor(Number(c.chitCurrentMonth) || 1) + 1;
    if (nextMonth > N) {
      return { paidRow, nextCycle: null };
    }
    const mode = c.chitInstallmentMode || "equal";
    const custom = c.chitCustomInstallment ?? c.amount;
    const newAmount = Math.round(resolveChitInstallment(c.chitValue, N, nextMonth, mode, custom));
    let nextDue = c.dueDate;
    try {
      const base = parseISO(`${c.dueDate}T12:00:00`);
      nextDue = format(addMonths(base, 1), "yyyy-MM-dd");
    } catch {
      /* keep */
    }
    const rolled = {
      ...c,
      id: newId,
      chitCurrentMonth: nextMonth,
      amount: newAmount,
      dueDate: nextDue,
      remainingAmount: newAmount,
      payments: [],
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    const eff = getEffectiveStatus(rolled, todayYmd());
    return { paidRow, nextCycle: { ...rolled, status: eff } };
  }

  let nextDue = c.dueDate;
  try {
    const base = parseISO(`${c.dueDate}T12:00:00`);
    const step = repeatIntervalMonths(repeatType) || 1;
    const nextDate = addMonths(base, step);
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
    status: eff,
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
