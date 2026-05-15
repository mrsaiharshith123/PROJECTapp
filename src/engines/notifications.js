import { buildCommitmentReminders, buildLendingReminders } from "./reminders.js";

/**
 * Build in-app notification items from reminders (no push).
 * @returns {{ id: string, message: string, urgency: string, createdAt: number, read: boolean }[]}
 */
export function buildNotificationFeed({
  commitments,
  lendings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
  insights = [],
  readIds = [],
}) {
  const readSet = new Set(readIds || []);
  const now = Date.now();
  const items = [];

  const commitmentReminders = buildCommitmentReminders(commitments, getEffectiveStatus, todayStr);
  for (const r of commitmentReminders) {
    items.push({
      id: `c-${r.id}`,
      message: r.message,
      urgency: r.urgency,
      dueDate: r.dueDate,
      amount: r.amount,
      createdAt: now,
      read: readSet.has(`c-${r.id}`),
    });
  }

  const lendingReminders = buildLendingReminders(lendings, todayStr, getEffectiveLendingStatus);
  for (const r of lendingReminders) {
    const nid = `l-${r.id}`;
    items.push({
      id: nid,
      message: r.message,
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
