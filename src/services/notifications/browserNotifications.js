const PERM_KEY = "committrack_notif_permission_asked";

/** @returns {boolean} */
export function isNotificationSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  try {
    localStorage.setItem(PERM_KEY, "1");
  } catch {
    /* ignore */
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function wasPermissionAsked() {
  try {
    return localStorage.getItem(PERM_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Show a local browser notification (no push server).
 * @param {{ title: string, body: string, tag?: string, data?: object }} payload
 */
export async function showLocalNotification(payload) {
  if (!isNotificationSupported() || Notification.permission !== "granted") return false;
  const { title, body, tag, data } = payload;
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        tag: tag || "committrack",
        data,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
      });
      return true;
    }
    new Notification(title, { body, tag, icon: "/favicon.svg" });
    return true;
  } catch {
    return false;
  }
}

/** Dev / settings test ping */
export async function sendTestNotification() {
  return showLocalNotification({
    title: "CommitTrack",
    body: "Reminders are enabled on this device. Due alerts will appear here.",
    tag: "committrack-test",
  });
}
