import { showLocalNotification } from "./browserNotifications.js";

/**
 * Bridge in-app notification feed items to browser notifications (local only).
 * Call sparingly (e.g. on app open) to avoid spam.
 */
export async function syncFeedToBrowserNotifications(feedItems, { max = 3 } = {}) {
  if (!feedItems?.length) return 0;
  const unread = feedItems.filter((n) => !n.read).slice(0, max);
  let sent = 0;
  for (const item of unread) {
    const ok = await showLocalNotification({
      title: item.title || "CommitTrack reminder",
      body: item.message || item.text || "",
      tag: `ct-${item.id}`,
      data: { id: item.id, route: item.route },
    });
    if (ok) sent += 1;
  }
  return sent;
}

export const REMINDER_TYPES = [
  "due_reminder",
  "overdue",
  "forecast_alert",
  "subscription_renewal",
  "pressure_warning",
];
