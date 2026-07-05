import { useCallback } from "react";
import { usePerovo } from "../context/PerovoContext.jsx";
import { useBroadcasts } from "./useBroadcasts.js";

/** Mark in-app notifications read — engine feed, broadcasts, and server alerts. */
export function useNotificationActions() {
  const { markNotificationRead, markAllNotificationsRead } = usePerovo();
  const { dismiss, dismissUserNotification } = useBroadcasts();

  const syncRemoteRead = useCallback(
    (n) => {
      if (n.source === "broadcast" && n.broadcastId) {
        dismiss(n.broadcastId);
      } else if (n.source === "server" && n.notificationId) {
        dismissUserNotification(n.notificationId);
      }
    },
    [dismiss, dismissUserNotification],
  );

  const markRead = useCallback(
    (n) => {
      if (!n?.id || n.read) return;
      markNotificationRead(n.id);
      syncRemoteRead(n);
    },
    [markNotificationRead, syncRemoteRead],
  );

  const markAllRead = useCallback(
    (notifications) => {
      const unread = (notifications || []).filter((n) => !n.read);
      if (unread.length === 0) return;
      markAllNotificationsRead(unread.map((n) => n.id));
      for (const n of unread) syncRemoteRead(n);
    },
    [markAllNotificationsRead, syncRemoteRead],
  );

  return { markRead, markAllRead };
}
