import { showLocalNotification } from "./browserNotifications.js";
import { requestServiceWorkerReminderFlush } from "./backgroundNotificationSync.js";
import {
  markBrowserNotificationSent,
  wasBrowserNotificationSent,
} from "./notificationDelivery.js";

/**
 * Bridge in-app notification feed items to system notifications (local only).
 */
export async function syncFeedToBrowserNotifications(
  feedItems,
  { max = 3, todayStr, skipAlreadySent = true } = {}
) {
  if (!feedItems?.length) return 0;
  const unread = feedItems.filter((n) => !n.read).slice(0, max);
  let sent = 0;
  for (const item of unread) {
    if (skipAlreadySent && todayStr && wasBrowserNotificationSent(item.id, todayStr)) continue;
    const ok = await showLocalNotification({
      title: item.title || "CommitTrack reminder",
      body: item.message || item.text || "",
      tag: `ct-${item.id}`,
      data: { id: item.id, route: item.route },
    });
    if (ok) {
      if (todayStr) markBrowserNotificationSent(item.id, todayStr);
      sent += 1;
    }
  }
  if (sent > 0) await requestServiceWorkerReminderFlush();
  return sent;
}

export const REMINDER_TYPES = [
  "due_reminder",
  "overdue",
  "forecast_alert",
  "subscription_renewal",
  "pressure_warning",
];
