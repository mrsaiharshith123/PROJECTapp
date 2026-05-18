import { buildContextualReminderFeed } from "./contextualReminders.js";

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
