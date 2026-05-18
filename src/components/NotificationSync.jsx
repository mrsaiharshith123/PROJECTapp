import { useEffect, useRef } from "react";
import { useCommitIntel } from "../hooks/useCommitIntel.js";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import {
  getNotificationPermission,
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
  const { todayStr, settings } = useCommitTrack();
  const { notifications } = useCommitIntel();
  const digestRan = useRef(false);
  const periodicRegistered = useRef(false);
  const lastSnapshotKey = useRef("");

  useEffect(() => {
    if (settings.remindersEnabled === false) return;
    if (getNotificationPermission() !== "granted") return;

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

    const runUrgent = () => {
      const urgent = pickDigestNotifications(
        notifications.filter((n) => n.urgency === "critical" || n.urgency === "high"),
        3
      );
      if (urgent.length === 0) return;
      syncFeedToBrowserNotifications(
        urgent.map((n) => ({
          id: n.id,
          title: n.urgency === "critical" ? "CommitTrack — overdue" : "CommitTrack — due soon",
          message: n.message,
          read: n.read,
        })),
        { max: 3, todayStr, skipAlreadySent: true }
      );
    };

    const runDailyDigest = () => {
      if (digestRan.current || !shouldRunDailyDigest(todayStr)) return;
      const digest = pickDigestNotifications(unread, 4);
      if (digest.length === 0) return;
      digestRan.current = true;
      syncFeedToBrowserNotifications(
        digest.map((n) => ({
          id: n.id,
          title: "CommitTrack",
          message: n.message,
          read: n.read,
        })),
        { max: 4, todayStr, skipAlreadySent: true }
      ).then((sent) => {
        if (sent > 0) markDailyDigestRan(todayStr);
      });
    };

    const flushBackground = () => {
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
  }, [notifications, todayStr, settings.remindersEnabled]);

  return null;
}
