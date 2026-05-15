import { useEffect, useRef } from "react";
import { useCommitIntel } from "../hooks/useCommitIntel.js";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import {
  getNotificationPermission,
  syncFeedToBrowserNotifications,
} from "../services/notifications/index.js";
import { shouldRunDailyDigest, markDailyDigestRan, pickDigestNotifications } from "../services/notifications/scheduler.js";

/** Syncs in-app feed to browser notifications once per day when permitted. */
export default function NotificationSync() {
  const { todayStr } = useCommitTrack();
  const { notifications } = useCommitIntel();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (getNotificationPermission() !== "granted") return;
    if (!shouldRunDailyDigest(todayStr)) return;
    ran.current = true;

    const digest = pickDigestNotifications(notifications, 3);
    if (digest.length === 0) return;

    syncFeedToBrowserNotifications(
      digest.map((n) => ({
        id: n.id,
        title: n.title || "CommitTrack",
        message: n.message || n.text,
        read: n.read,
      }))
    ).then(() => markDailyDigestRan(todayStr));
  }, [notifications, todayStr]);

  return null;
}
