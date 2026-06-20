import { assetUrl } from "../../utils/basePath.js";
import { isNativeCapacitorShell, checkNativePermission, requestNativePermission } from "../../utils/nativePermissions.js";

const PERM_KEY = "perovo_notif_permission_asked";
const SW_READY_MS = 4000;

export function absoluteNotificationIconUrl() {
  if (typeof window === "undefined") return "/pwa-192.png";
  try {
    return new URL(assetUrl("pwa-192.png"), window.location.href).href;
  } catch {
    return assetUrl("pwa-192.png");
  }
}

/** @returns {boolean} */
export function isNotificationSupported() {
  if (isNativeCapacitorShell()) return true;
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission() {
  if (isNativeCapacitorShell()) return "default";
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/** @returns {Promise<NotificationPermission | "unsupported">} */
export async function resolveNotificationPermission() {
  if (isNativeCapacitorShell()) {
    const perm = await checkNativePermission("notifications");
    if (perm === "prompt") return "default";
    if (perm === "granted") return "granted";
    if (perm === "denied") return "denied";
    return "default";
  }
  return getNotificationPermission();
}

export async function requestNotificationPermission() {
  if (isNativeCapacitorShell()) {
    try {
      localStorage.setItem(PERM_KEY, "1");
    } catch {
      /* ignore */
    }
    const perm = await requestNativePermission("notifications");
    return perm === "granted" ? "granted" : perm === "denied" ? "denied" : "default";
  }

  if (!isNotificationSupported()) return "unsupported";
  try {
    localStorage.setItem(PERM_KEY, "1");
  } catch {
    /* ignore */
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  if (result === "granted") {
    import("./fcmService.js")
      .then(({ requestFcmToken }) => requestFcmToken())
      .then((token) => {
        if (token) {
          try {
            localStorage.setItem("perovo_fcm_token", token);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});
  }
  return result;
}

export function wasPermissionAsked() {
  try {
    return localStorage.getItem(PERM_KEY) === "1";
  } catch {
    return false;
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

/** Resolve an active service worker registration when PWA is installed. */
export async function getActiveServiceWorkerRegistration() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (reg?.active) return reg;
    reg = await withTimeout(navigator.serviceWorker.ready, SW_READY_MS);
    return reg?.active ? reg : null;
  } catch {
    return null;
  }
}

function showViaWindowNotification(title, body, tag) {
  const n = new Notification(title, {
    body,
    tag: tag || "perovo",
    icon: absoluteNotificationIconUrl(),
  });
  n.onclick = () => {
    window.focus();
    n.close();
  };
  return true;
}

async function showViaNativeNotification(title, body, tag, data) {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await checkNativePermission("notifications");
  if (perm !== "granted") return false;
  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.floor(Math.random() * 2147480000),
        title,
        body,
        extra: { ...(data || {}), tag: tag || "perovo" },
      },
    ],
  });
  return true;
}

/**
 * Show a system notification (phone/laptop tray). Uses service worker when available.
 * @param {{ title: string, body: string, tag?: string, data?: object }} payload
 * @returns {Promise<boolean>}
 */
export async function showLocalNotification(payload) {
  const { title, body, tag, data } = payload;

  if (isNativeCapacitorShell()) {
    try {
      return await showViaNativeNotification(title, body, tag, data);
    } catch {
      return false;
    }
  }

  if (!isNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const icon = absoluteNotificationIconUrl();
  const options = {
    body,
    tag: tag || "perovo",
    data,
    icon,
    badge: icon,
    vibrate: [180, 80, 180],
    renotify: true,
    silent: false,
    requireInteraction: false,
  };

  try {
    const reg = await getActiveServiceWorkerRegistration();
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    const ready = await navigator.serviceWorker?.ready;
    if (ready) {
      await ready.showNotification(title, options);
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    return showViaWindowNotification(title, body, tag);
  } catch {
    return false;
  }
}

/** Request permission if needed, then show a test system notification. */
export async function sendTestNotification() {
  if (!isNotificationSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  let perm = await resolveNotificationPermission();
  if (perm === "default") {
    perm = await requestNotificationPermission();
  }
  if (perm !== "granted") {
    return { ok: false, reason: perm === "denied" ? "denied" : "blocked" };
  }

  const ok = await showLocalNotification({
    title: "Perovo",
    body: "Notifications are working. Due and overdue bills will alert you here.",
    tag: "perovo-test",
    data: { type: "test" },
  });
  return { ok, reason: ok ? null : "show_failed" };
}
