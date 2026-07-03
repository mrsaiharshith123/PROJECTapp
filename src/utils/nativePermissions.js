import { isEmbeddedApp } from "./embeddedApp.js";

/** @returns {boolean} */
export function isNativeCapacitorShell() {
  if (!isEmbeddedApp()) return false;
  if (typeof window === "undefined") return false;
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

/**
 * @param {"camera"|"photos"|"notifications"|"location"} kind
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
    if (kind === "location") {
      const { Geolocation } = await import("@capacitor/geolocation");
      const result = await Geolocation.checkPermissions();
      return normalizePerm(result.location ?? result.coarseLocation);
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
 * @param {"camera"|"photos"|"notifications"|"location"} kind
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
    if (kind === "location") {
      const { Geolocation } = await import("@capacitor/geolocation");
      const result = await Geolocation.requestPermissions();
      return normalizePerm(result.location ?? result.coarseLocation);
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

const ANDROID_PACKAGE_ID = "app.perovo.mobile";

/**
 * @returns {Promise<{ notifications: string, camera: string, photos: string, location: string }>}
 */
export async function checkEssentialPermissions() {
  const [notifications, camera, photos, location] = await Promise.all([
    checkNativePermission("notifications"),
    checkNativePermission("camera"),
    checkNativePermission("photos"),
    checkNativePermission("location"),
  ]);
  return { notifications, camera, photos, location };
}

/** @param {{ notifications: string, camera: string, photos: string, location: string }} status */
export function allEssentialPermissionsGranted(status) {
  return (
    status.notifications === "granted" &&
    status.camera === "granted" &&
    status.photos === "granted" &&
    status.location === "granted"
  );
}

/** @param {{ notifications: string, camera: string, photos: string, location: string }} status */
export function anyEssentialPermissionDenied(status) {
  return (
    status.notifications === "denied" ||
    status.camera === "denied" ||
    status.photos === "denied" ||
    status.location === "denied"
  );
}

/**
 * Show Android system permission dialogs for reminders, camera, photos, and location.
 * @returns {Promise<{ notifications: string, camera: string, photos: string, location: string } | null>}
 */
export async function requestEssentialPermissions() {
  if (!isNativeCapacitorShell()) return null;

  let notifications = await checkNativePermission("notifications");
  if (notifications !== "granted") {
    notifications = await requestNativePermission("notifications");
  }

  const { Camera } = await import("@capacitor/camera");
  const current = await Camera.checkPermissions();
  let camera = normalizePerm(current.camera);
  let photos = normalizePerm(current.photos);

  if (camera !== "granted" || photos !== "granted") {
    const result = await Camera.requestPermissions({ permissions: ["camera", "photos"] });
    camera = normalizePerm(result.camera);
    photos = normalizePerm(result.photos);
  }

  let location = await checkNativePermission("location");
  if (location !== "granted") {
    location = await requestNativePermission("location");
  }

  return { notifications, camera, photos, location };
}

/** Open this app's page in Android system settings (when user tapped Deny). */
export function openAndroidAppSettings() {
  if (!isNativeCapacitorShell()) return;
  if (window.Capacitor?.getPlatform?.() !== "android") return;
  window.location.href = `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;scheme=package;package=${ANDROID_PACKAGE_ID};end`;
}
