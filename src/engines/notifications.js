import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  buildCommitmentReminders,
  buildLendingReminders,
  buildLumpyBillHorizonReminders,
} from "./reminders.js";
import { freeMoneyAfterBurden } from "./pressureScore.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";

/**
 * Enrich reminder messages with amount + free-cash context (feeds in-app + OS notifications).
 */
export function buildContextualReminderFeed({
  commitments,
  lendings,
  settings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
}) {
  const income = combinedMonthlyIncome(settings);
  const cash = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);

  const base = [
    ...buildCommitmentReminders(commitments, getEffectiveStatus, todayStr),
    ...buildLendingReminders(lendings, todayStr, getEffectiveLendingStatus),
    ...buildLumpyBillHorizonReminders(commitments, getEffectiveStatus, todayStr),
  ];

  return base.map((r) => {
    const amt = Math.max(0, Number(r.amount) || 0);
    let daysUntil = null;
    try {
      if (r.dueDate) {
        daysUntil = differenceInCalendarDays(parseISO(`${r.dueDate}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
      }
    } catch {
      /* ignore */
    }

    const afterPay = Math.round(cash.freeMoney - amt);
    let detail = "";
    if (amt > 0 && daysUntil != null && daysUntil >= 0) {
      detail = ` ₹${amt.toLocaleString("en-IN")} due`;
      if (daysUntil === 0) detail += " today";
      else if (daysUntil <= 7) detail += ` in ${daysUntil}d`;
      if (income > 0) {
        detail += afterPay >= 0 ? ` · ~₹${afterPay.toLocaleString("en-IN")} left after` : " · may exceed free cash";
      }
    }

    const title =
      r.urgency === "critical" ? "CommitTrack — overdue" : "CommitTrack reminder";

    return {
      ...r,
      title,
      message: `${r.message}${detail}`,
      osBody: `${r.name}:${detail || ` ₹${amt.toLocaleString("en-IN")}`}`.trim(),
    };
  });
}

function notificationId(r) {
  const id = String(r.id);
  if (id.startsWith("lend-")) return `l-${id}`;
  return `c-${id}`;
}

/**
 * Build in-app notification items from contextual reminders (no push).
 */
export function buildNotificationFeed({
  commitments,
  lendings,
  settings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
  insights = [],
  readIds = [],
}) {
  const readSet = new Set(readIds || []);
  const now = Date.now();
  const items = [];

  const contextual = buildContextualReminderFeed({
    commitments,
    lendings,
    settings: settings || {},
    getEffectiveStatus,
    getEffectiveLendingStatus,
    todayStr,
  });

  for (const r of contextual) {
    const nid = notificationId(r);
    items.push({
      id: nid,
      message: r.message,
      title: r.title,
      osBody: r.osBody,
      urgency: r.urgency,
      dueDate: r.dueDate,
      amount: r.amount,
      createdAt: now,
      read: readSet.has(nid) || readSet.has(String(r.id)),
    });
  }

  for (const ins of insights || []) {
    if (ins.tone === "critical" || ins.tone === "warning") {
      const nid = `ins-${ins.id}`;
      items.push({
        id: nid,
        message: ins.text,
        title: "CommitTrack",
        osBody: ins.text,
        urgency: ins.tone === "critical" ? "critical" : "high",
        createdAt: now,
        read: readSet.has(nid),
      });
    }
  }

  const order = { critical: 0, high: 1, normal: 2, low: 3 };
  return items.sort((a, b) => (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9));
}

export function unreadCount(notifications) {
  return notifications.filter((n) => !n.read).length;
}
