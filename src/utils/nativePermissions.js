import { isEmbeddedApp } from "./embeddedApp.js";
import { withTimeout } from "./withTimeout.js";

// Native plugin calls have no built-in timeout — if the Capacitor bridge is
// briefly unresponsive (observed right after a Capgo OTA reload swaps the
// WebView content), an unawaited-forever promise leaves the permission gate
// stuck on its "Allow" button indefinitely with no way out. Every native
// call in this file goes through this so a bridge hiccup surfaces as a
// normal failure instead of hanging the UI forever.
const NATIVE_CALL_TIMEOUT_MS = 8000;

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
      const result = await withTimeout(LocalNotifications.checkPermissions(), NATIVE_CALL_TIMEOUT_MS, "check_notifications");
      return normalizePerm(result.display);
    }
    if (kind === "location") {
      const { Geolocation } = await import("@capacitor/geolocation");
      const result = await withTimeout(Geolocation.checkPermissions(), NATIVE_CALL_TIMEOUT_MS, "check_location");
      return normalizePerm(result.location ?? result.coarseLocation);
    }
    const { Camera } = await import("@capacitor/camera");
    const result = await withTimeout(Camera.checkPermissions(), NATIVE_CALL_TIMEOUT_MS, "check_camera");
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
      const result = await withTimeout(LocalNotifications.requestPermissions(), NATIVE_CALL_TIMEOUT_MS, "request_notifications");
      return normalizePerm(result.display);
    }
    if (kind === "location") {
      const { Geolocation } = await import("@capacitor/geolocation");
      const result = await withTimeout(Geolocation.requestPermissions(), NATIVE_CALL_TIMEOUT_MS, "request_location");
      return normalizePerm(result.location ?? result.coarseLocation);
    }
    const { Camera } = await import("@capacitor/camera");
    const result = await withTimeout(
      Camera.requestPermissions({ permissions: ["camera", "photos"] }),
      NATIVE_CALL_TIMEOUT_MS,
      "request_camera",
    );
    if (kind === "camera") return normalizePerm(result.camera);
    return normalizePerm(result.photos);
  } catch {
    return "unsupported";
  }
}

/**
 * Capacitor plugins can return states beyond the three we gate on
 * ("granted"/"denied"/"prompt") — e.g. "limited" (iOS partial photo access)
 * or "prompt-with-rationale". Previously anything unrecognized silently
 * became "denied", which triggers "you denied this — open Settings"
 * messaging even when the permission is actually fine (or the check itself
 * just failed/timed out). Only the literal "denied" means denied; anything
 * else unrecognized falls back to "prompt" (ask again), never a false denial.
 * @param {string | undefined} value
 */
function normalizePerm(value) {
  if (value === "granted" || value === "denied" || value === "prompt") return value;
  if (value === "limited") return "granted";
  return "prompt";
}

const ANDROID_PACKAGE_ID = "app.perovo.mobile";

/** Set once a device has ever had every essential permission granted at the same time. */
const EVER_FULLY_GRANTED_KEY = "perovo_native_perms_ever_granted_v1";

function markEverFullyGranted() {
  try {
    localStorage.setItem(EVER_FULLY_GRANTED_KEY, "1");
  } catch {
    /* ignore */
  }
}

function wasEverFullyGranted() {
  try {
    return localStorage.getItem(EVER_FULLY_GRANTED_KEY) === "1";
  } catch {
    return false;
  }
}

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
  const status = { notifications, camera, photos, location };

  if (allEssentialPermissionsGranted(status)) {
    markEverFullyGranted();
    return status;
  }

  // A device that has previously proven every permission was granted can
  // only lose that via an explicit OS-level revoke, which always reports
  // "denied" — never "unsupported"/"prompt". So if nothing here is an
  // explicit "denied" (i.e. everything short of fully-granted is just a
  // transient check hiccup — the exact failure mode right after a Capgo OTA
  // reload, before this fix, left users stuck re-granting permissions they
  // already gave at install), trust the prior grant instead of re-blocking
  // the user with a gate that can never actually be satisfied this launch.
  if (wasEverFullyGranted() && !anyEssentialPermissionDenied(status)) {
    return { notifications: "granted", camera: "granted", photos: "granted", location: "granted" };
  }

  return status;
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

  // Each of these already has its own timeout (see checkNativePermission /
  // requestNativePermission above) — run them in sequence, not parallel,
  // since stacking multiple system permission dialogs at once is confusing
  // and some Android versions only show one at a time anyway.
  const requestOne = async (kind) => {
    let state = await checkNativePermission(kind);
    if (state !== "granted") state = await requestNativePermission(kind);
    return state;
  };

  const notifications = await requestOne("notifications");
  const camera = await requestOne("camera");
  const photos = await requestOne("photos");
  const location = await requestOne("location");

  return { notifications, camera, photos, location };
}

/** Open this app's page in Android system settings (when user tapped Deny). */
export function openAndroidAppSettings() {
  if (!isNativeCapacitorShell()) return;
  if (window.Capacitor?.getPlatform?.() !== "android") return;
  window.location.href = `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;scheme=package;package=${ANDROID_PACKAGE_ID};end`;
}

/** Android 8+ — grant "Install unknown apps" for sideload APK updates. */
export function openAndroidInstallPermissionSettings() {
  if (!isNativeCapacitorShell()) return;
  if (window.Capacitor?.getPlatform?.() !== "android") return;
  window.location.href = `intent:#Intent;action=android.settings.MANAGE_UNKNOWN_APP_SOURCES;package=${ANDROID_PACKAGE_ID};end`;
}
