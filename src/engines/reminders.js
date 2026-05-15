import { differenceInCalendarDays, parseISO } from "date-fns";

/** @typedef {"critical" | "high" | "normal" | "low"} ReminderUrgency */

function urgencyForCommitment(c, getEffectiveStatusFn, todayStr) {
  const eff = getEffectiveStatusFn(c);
  if (eff === "overdue") return { urgency: "critical", reason: "overdue" };
  if (c.priority === "critical" && eff !== "paid") {
    return { urgency: "high", reason: "critical_priority" };
  }
  if (c.priority === "low") return { urgency: "low", reason: "low_priority" };
  try {
    const days = differenceInCalendarDays(parseISO(`${c.dueDate}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
    if (days >= 0 && days <= 3 && eff !== "paid") return { urgency: "high", reason: "due_soon" };
    if (days >= 0 && days <= 7 && eff !== "paid") return { urgency: "normal", reason: "due_this_week" };
  } catch {
    /* ignore */
  }
  return { urgency: "normal", reason: "default" };
}

/**
 * In-app reminder list (no push). Sorted: critical first, then by due date.
 */
export function buildCommitmentReminders(commitments, getEffectiveStatusFn, todayStr) {
  return commitments
    .filter((c) => getEffectiveStatusFn(c) !== "paid")
    .map((c) => {
      const { urgency, reason } = urgencyForCommitment(c, getEffectiveStatusFn, todayStr);
      return {
        id: c.id,
        name: c.name,
        dueDate: c.dueDate,
        amount: Number(c.remainingAmount ?? c.amount ?? 0),
        category: c.category,
        urgency: /** @type {ReminderUrgency} */ (urgency),
        reason,
        message:
          urgency === "critical"
            ? `Overdue: ${c.name}`
            : urgency === "high"
              ? `Due soon: ${c.name}`
              : `Upcoming: ${c.name}`,
      };
    })
    .sort((a, b) => {
      const order = { critical: 0, high: 1, normal: 2, low: 3 };
      const d = (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
      if (d !== 0) return d;
      return (a.dueDate || "").localeCompare(b.dueDate || "");
    });
}

export function buildLendingReminders(lendings, todayStr, getEffectiveLendingStatusFn) {
  return lendings
    .filter((l) => getEffectiveLendingStatusFn(l, todayStr) !== "complete")
    .map((l) => {
      const st = getEffectiveLendingStatusFn(l, todayStr);
      const urgency = st === "overdue" ? "critical" : "normal";
      return {
        id: `lend-${l.id}`,
        name: `${l.personName} (${l.type === "lent" ? "lent" : "borrowed"})`,
        dueDate: l.dueDate,
        amount: Number(l.remainingAmount ?? 0),
        category: "Lending",
        urgency,
        reason: st,
        message: st === "overdue" ? `Lending overdue: ${l.personName}` : `Lending due: ${l.personName}`,
      };
    })
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
}
