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
/** Subscription with end date — remind a few days before to cancel auto-pay. */
export function buildSubscriptionEndReminders(commitments, todayStr) {
  const out = [];
  for (const c of commitments) {
    if (c.category !== "Subscription" || !c.endDate) continue;
    try {
      const days = differenceInCalendarDays(
        parseISO(`${c.endDate}T12:00:00`),
        parseISO(`${todayStr}T12:00:00`)
      );
      if (days >= 2 && days <= 4) {
        out.push({
          id: `sub-end-${c.id}`,
          name: c.name,
          dueDate: c.endDate,
          amount: Number(c.amount) || 0,
          category: c.category,
          urgency: /** @type {ReminderUrgency} */ ("high"),
          reason: "subscription_ending",
          message: `${c.name} ends soon — cancel auto-pay if you do not want to renew.`,
        });
      }
    } catch {
      /* ignore */
    }
  }
  return out;
}

export function buildCommitmentReminders(commitments, getEffectiveStatusFn, todayStr) {
  const subEnd = buildSubscriptionEndReminders(commitments, todayStr);
  const dueReminders = commitments
    .filter((c) => {
      const eff = getEffectiveStatusFn(c, todayStr);
      return eff !== "paid" && eff !== "upnext";
    })
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

  return [...subEnd, ...dueReminders].sort((a, b) => {
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
