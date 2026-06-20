import { isEmbeddedApp } from "./embeddedApp.js";

/** @returns {boolean} */
export function isNativeCapacitorShell() {
  if (!isEmbeddedApp()) return false;
  if (typeof window === "undefined") return false;
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

/**
 * @param {"camera"|"photos"|"notifications"} kind
 * @returns {Promise<"granted"|"denied"|"prompt"|"unsupported">}
 */
export async function checkNativePermission(kind) {
  if (!isNativeCapacitorShell()) return "unsupported";
  try {
    if (kind === "notifications") {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.checkPermissions();
      return normalizePerm(result.display);
    }
    const { Camera } = await import("@capacitor/camera");
    const result = await Camera.checkPermissions();
    if (kind === "camera") return normalizePerm(result.camera);
    return normalizePerm(result.photos);
  } catch {
    return "unsupported";
  }
}

/**
 * @param {"camera"|"photos"|"notifications"} kind
 * @returns {Promise<"granted"|"denied"|"prompt"|"unsupported">}
 */
export async function requestNativePermission(kind) {
  if (!isNativeCapacitorShell()) return "unsupported";
  try {
    if (kind === "notifications") {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      return normalizePerm(result.display);
    }
    const { Camera } = await import("@capacitor/camera");
    const result = await Camera.requestPermissions({ permissions: ["camera", "photos"] });
    if (kind === "camera") return normalizePerm(result.camera);
    return normalizePerm(result.photos);
  } catch {
    return "unsupported";
  }
}

/** @param {string | undefined} value */
function normalizePerm(value) {
  if (value === "granted" || value === "denied" || value === "prompt") return value;
  return "denied";
}
