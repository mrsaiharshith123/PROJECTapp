import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { usePerovo } from "../context/PerovoContext.jsx";
import {
  fetchActiveBroadcasts,
  fetchUserNotifications,
  dismissBroadcast,
  markUserNotificationRead,
} from "../services/broadcasts.js";

const POLL_INTERVAL_MS = 15 * 60 * 1000;

export function useBroadcasts() {
  const { user, isLoggedIn } = useAuth();
  const { effectiveSubscriptionTier } = usePerovo();
  const [broadcasts, setBroadcasts] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);

  const load = useCallback(async () => {
    if (!isLoggedIn || !user?.id) {
      setBroadcasts([]);
      setUserNotifications([]);
      return;
    }
    const tier = effectiveSubscriptionTier || "free";
    const [broadcastData, userNotifs] = await Promise.all([
      fetchActiveBroadcasts(user.id, tier),
      fetchUserNotifications(user.id),
    ]);
    setBroadcasts(broadcastData);
    setUserNotifications(userNotifs);
  }, [isLoggedIn, user, effectiveSubscriptionTier]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const dismiss = useCallback(
    async (broadcastId) => {
      setBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
      if (user?.id) await dismissBroadcast(user.id, broadcastId);
    },
    [user],
  );

  const dismissUserNotification = useCallback(
    async (notificationId) => {
      setUserNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (user?.id) await markUserNotificationRead(user.id, notificationId);
    },
    [user],
  );

  return {
    broadcasts,
    userNotifications,
    dismiss,
    dismissUserNotification,
    reload: load,
  };
}
