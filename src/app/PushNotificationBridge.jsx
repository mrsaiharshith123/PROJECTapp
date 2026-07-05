import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { usePerovo } from "../context/PerovoContext.jsx";
import { registerForPushNotifications, unregisterPushNotifications } from "../services/push/pushNotifications.js";
import { isPushConfigured } from "../services/push/pushTokenService.js";

/** Registers FCM / web push token when signed in and reminders are enabled. */
export default function PushNotificationBridge() {
  const { user, isLoggedIn, isReady } = useAuth();
  const { settings } = usePerovo();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isReady || !isLoggedIn || !user?.id) {
      registeredRef.current = false;
      return;
    }
    if (!isPushConfigured()) return;
    if (settings.remindersEnabled === false) return;
    if (registeredRef.current) return;

    registeredRef.current = true;
    registerForPushNotifications(user.id).catch(() => {
      registeredRef.current = false;
    });
  }, [isReady, isLoggedIn, user?.id, settings.remindersEnabled]);

  useEffect(() => {
    if (!isLoggedIn) {
      unregisterPushNotifications(user?.id).catch(() => {});
      registeredRef.current = false;
    }
  }, [isLoggedIn, user?.id]);

  return null;
}
