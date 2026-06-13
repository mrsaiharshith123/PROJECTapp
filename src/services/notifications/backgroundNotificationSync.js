import { getNotificationPermission, absoluteNotificationIconUrl } from "./browserNotifications.js";
import { writeNotificationSnapshot } from "./notificationSnapshotStore.js";
import { pickDigestNotifications } from "./scheduler.js";
import { wasBrowserNotificationSent } from "./notificationDelivery.js";

const SYNC_TAG = "committrack-reminders";
const PERIODIC_TAG = "committrack-reminders";

/**
 * Save unread reminders for the service worker and request a background flush.
 */
export async function pushReminderSnapshotToServiceWorker({
  notifications,
  remindersEnabled,
  todayStr,
}) {
  if (remindersEnabled === false) return;
  if (getNotificationPermission() !== "granted") return;

  const pending = pickDigestNotifications(
    (notifications || []).filter(
      (n) => !n.read && (!todayStr || !wasBrowserNotificationSent(n.id, todayStr))
    ),
    5
  ).map((n) => ({
    id: n.id,
    title: n.urgency === "critical" ? "Perovo — overdue" : "Perovo reminder",
    body: n.message || "",
    urgency: n.urgency,
  }));

  await writeNotificationSnapshot({
    remindersEnabled: remindersEnabled !== false,
    todayStr,
    iconUrl: absoluteNotificationIconUrl(),
    items: pending,
  });

  await requestServiceWorkerReminderFlush();
}

async function getRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

/** Ask the active service worker to show tray notifications now. */
export async function requestServiceWorkerReminderFlush() {
  const reg = await getRegistration();
  if (!reg?.active) return;

  reg.active.postMessage({ type: "FLUSH_REMINDERS" });

  if ("sync" in reg) {
    try {
      await reg.sync.register(SYNC_TAG);
    } catch {
      /* unsupported or throttled */
    }
  }
}

/** Register periodic checks (installed PWA, Chrome/Android primarily). */
export async function registerPeriodicReminderSync() {
  const reg = await getRegistration();
  if (!reg || !("periodicSync" in reg)) return false;

  try {
    const perm = await navigator.permissions.query({ name: "periodic-background-sync" });
    if (perm.state === "denied") return false;
    await reg.periodicSync.register(PERIODIC_TAG, {
      minInterval: 12 * 60 * 60 * 1000,
    });
    return true;
  } catch {
    return false;
  }
}

export { SYNC_TAG, PERIODIC_TAG };
