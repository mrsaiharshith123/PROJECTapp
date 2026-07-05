import { isNativeCapacitorShell } from "../../utils/nativePermissions.js";
import { log } from "../../utils/logger.js";
import { savePushToken, removePushToken, isPushConfigured } from "./pushTokenService.js";

let listenersBound = false;
let currentUserId = null;

function firebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

async function registerWebPush(userId) {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const cfg = firebaseConfig();
  if (!vapidKey || !cfg.projectId || !cfg.apiKey) return { ok: false, reason: "not_configured" };

  if (typeof Notification === "undefined" || Notification.permission !== "granted") {
    return { ok: false, reason: "denied" };
  }

  try {
    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
    if (!(await isSupported())) return { ok: false, reason: "unsupported" };

    const app = initializeApp(cfg, "perovo-push");
    const messaging = getMessaging(app);
    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
    if (!token) return { ok: false, reason: "no_token" };

    return savePushToken(userId, { token, platform: "web" });
  } catch (err) {
    log.auth.warn("Web push registration failed", { message: err instanceof Error ? err.message : String(err) });
    return { ok: false, reason: "register_failed" };
  }
}

async function registerNativePush(userId) {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== "granted") return { ok: false, reason: "denied" };

    if (!listenersBound) {
      listenersBound = true;
      PushNotifications.addListener("registration", async (ev) => {
        if (currentUserId && ev.value) {
          const platform = window.Capacitor?.getPlatform?.() || "native";
          await savePushToken(currentUserId, { token: ev.value, platform });
        }
      });
      PushNotifications.addListener("registrationError", (err) => {
        log.auth.warn("Native push registration error", { message: JSON.stringify(err) });
      });
      PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        const route = action.notification?.data?.route;
        if (route && typeof window !== "undefined") {
          window.location.href = route;
        }
      });
    }

    currentUserId = userId;
    await PushNotifications.register();
    return { ok: true };
  } catch (err) {
    log.auth.warn("Native push registration failed", { message: err instanceof Error ? err.message : String(err) });
    return { ok: false, reason: "register_failed" };
  }
}

/**
 * Register device for FCM push (native) or web push (browser with VAPID).
 * @param {string | null | undefined} userId
 */
export async function registerForPushNotifications(userId) {
  if (!userId || !isPushConfigured()) return { ok: false, reason: "not_configured" };
  currentUserId = userId;

  if (isNativeCapacitorShell()) {
    return registerNativePush(userId);
  }
  return registerWebPush(userId);
}

/** @param {string | null | undefined} userId */
export async function unregisterPushNotifications(userId) {
  currentUserId = null;
  if (!userId) return;

  if (isNativeCapacitorShell()) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const reg = await PushNotifications.checkPermissions();
      if (reg.receive === "granted") {
        await PushNotifications.removeAllListeners();
        listenersBound = false;
      }
    } catch {
      /* ignore */
    }
  }
}

export { removePushToken };
