import { useEffect, useRef } from "react";
import { useCommitIntel } from "../hooks/useCommitIntel.js";
import { usePerovo } from "../context/PerovoContext.jsx";
import { useTranslation } from "../i18n/I18nProvider.js";
import { translateNotification } from "../i18n/notificationLabels.js";
import { isNativeCapacitorShell } from "../utils/nativePermissions.js";
import {
  getNotificationPermission,
  resolveNotificationPermission,
  syncFeedToBrowserNotifications,
} from "../services/notifications/index.js";
import {
  shouldRunDailyDigest,
  markDailyDigestRan,
  pickDigestNotifications,
} from "../services/notifications/scheduler.js";
import {
  pushReminderSnapshotToServiceWorker,
  registerPeriodicReminderSync,
  requestServiceWorkerReminderFlush,
} from "../services/notifications/backgroundNotificationSync.js";

const URGENT_INTERVAL_MS = 15 * 60 * 1000;

/** Pushes reminders to the OS notification panel (tray) and in-app bell. */
export default function NotificationSync() {
  const { t } = useTranslation();
  const { todayStr, settings } = usePerovo();
  const { notifications } = useCommitIntel();
  const digestRan = useRef(false);
  const periodicRegistered = useRef(false);
  const lastSnapshotKey = useRef("");

  useEffect(() => {
    if (settings.remindersEnabled === false) return;

    let cancelled = false;
    const native = isNativeCapacitorShell();

    const ensurePermission = async () => {
      if (native) {
        const perm = await resolveNotificationPermission();
        return perm === "granted";
      }
      return getNotificationPermission() === "granted";
    };

    const run = async () => {
      const allowed = await ensurePermission();
      if (cancelled || !allowed) return;

      if (!native) {
        if (!periodicRegistered.current) {
          periodicRegistered.current = true;
          registerPeriodicReminderSync();
        }

        const unread = notifications.filter((n) => !n.read);
        const snapshotKey = unread.map((n) => n.id).join("|");
        if (snapshotKey !== lastSnapshotKey.current) {
          lastSnapshotKey.current = snapshotKey;
          pushReminderSnapshotToServiceWorker({
            notifications,
            remindersEnabled: settings.remindersEnabled,
            todayStr,
          });
        }
      }

      const runUrgent = () => {
        const urgent = pickDigestNotifications(
          notifications.filter((n) => n.urgency === "critical" || n.urgency === "high"),
          3,
        );
        if (urgent.length === 0) return;
        syncFeedToBrowserNotifications(
          urgent.map((n) => {
            const copy = translateNotification(t, n);
            return {
              id: n.id,
              title:
                copy.title ||
                t(n.urgency === "critical" ? "notifications.title.overdue" : "notifications.title.dueSoon"),
              message: copy.message,
              read: n.read,
            };
          }),
          { max: 3, todayStr, skipAlreadySent: true },
        );
      };

      const runDailyDigest = () => {
        if (digestRan.current || !shouldRunDailyDigest(todayStr)) return;
        const digest = pickDigestNotifications(
          notifications.filter((n) => !n.read),
          4,
        );
        if (digest.length === 0) return;
        digestRan.current = true;
        syncFeedToBrowserNotifications(
          digest.map((n) => {
            const copy = translateNotification(t, n);
            return {
              id: n.id,
              title: copy.title || t("notifications.insight.title"),
              message: copy.message,
              read: n.read,
            };
          }),
          { max: 4, todayStr, skipAlreadySent: true },
        ).then((sent) => {
          if (sent > 0) markDailyDigestRan(todayStr);
        });
      };

      const flushBackground = () => {
        if (native) return;
        pushReminderSnapshotToServiceWorker({
          notifications,
          remindersEnabled: settings.remindersEnabled,
          todayStr,
        });
        requestServiceWorkerReminderFlush();
      };

      runUrgent();
      runDailyDigest();

      const onVisibility = () => {
        if (document.visibilityState === "hidden") {
          flushBackground();
        } else if (document.visibilityState === "visible") {
          runUrgent();
          flushBackground();
        }
      };

      document.addEventListener("visibilitychange", onVisibility);
      const timer = setInterval(() => {
        runUrgent();
        flushBackground();
      }, URGENT_INTERVAL_MS);

      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        clearInterval(timer);
      };
    };

    let cleanup = () => {};
    run().then((dispose) => {
      if (typeof dispose === "function") cleanup = dispose;
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [notifications, todayStr, settings.remindersEnabled, t]);

  return null;
}
