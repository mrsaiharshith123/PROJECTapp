import { compareSemver } from "../utils/updateServer.js";

const PENDING_KEY = "perovo_apk_install_pending";
const DOWNLOADED_KEY = "perovo_apk_downloaded";
const DISMISS_KEY = "perovo_apk_install_dismissed";

/**
 * @returns {{ version: string, at: string } | null}
 */
export function getPendingApkInstall() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.version) return null;
    return { version: String(parsed.version), at: parsed.at ? String(parsed.at) : "" };
  } catch {
    return null;
  }
}

/**
 * @returns {{ version: string, at: string } | null}
 */
export function getApkDownloadedRecord() {
  try {
    const raw = localStorage.getItem(DOWNLOADED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.version) return null;
    return { version: String(parsed.version), at: parsed.at ? String(parsed.at) : "" };
  } catch {
    return null;
  }
}

/** @param {string} version */
export function markApkDownloaded(version) {
  if (!version) return;
  try {
    localStorage.setItem(
      DOWNLOADED_KEY,
      JSON.stringify({ version: String(version), at: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

/** @param {string} remoteVersion */
export function isApkDownloadedForVersion(remoteVersion) {
  const record = getApkDownloadedRecord();
  if (!record?.version || !remoteVersion) return false;
  return compareSemver(record.version, remoteVersion) >= 0;
}

/** @param {string} version */
export function markApkInstallPending(version) {
  if (!version) return;
  try {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ version: String(version), at: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

/** @param {string} version */
export function dismissApkInstallPrompt(version) {
  if (!version) return;
  try {
    localStorage.setItem(DISMISS_KEY, String(version));
  } catch {
    /* ignore */
  }
}

/** @param {string} version */
export function isApkInstallPromptDismissed(version) {
  if (!version) return false;
  try {
    return localStorage.getItem(DISMISS_KEY) === String(version);
  } catch {
    return false;
  }
}

export function clearPendingApkInstall() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

const PERMISSION_REQUESTED_KEY = "perovo_apk_permission_requested";

/** Mark that we opened Settings for install permission — need retry on return */
export function markApkPermissionRequested(version) {
  if (!version) return;
  try {
    localStorage.setItem(
      PERMISSION_REQUESTED_KEY,
      JSON.stringify({ version: String(version), at: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

/** Was the permission settings page opened for this version? */
export function wasApkPermissionRequested(version) {
  if (!version) return false;
  try {
    const raw = localStorage.getItem(PERMISSION_REQUESTED_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return String(parsed?.version) === String(version);
  } catch {
    return false;
  }
}

export function clearApkPermissionRequested() {
  try {
    localStorage.removeItem(PERMISSION_REQUESTED_KEY);
  } catch {
    /* ignore */
  }
}

export function clearApkUpdateTracking() {
  clearPendingApkInstall();
  clearApkPermissionRequested();
  try {
    localStorage.removeItem(DOWNLOADED_KEY);
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* ignore */
  }
  void import("./updateStorageCleanup.js")
    .then((m) => m.deleteCachedApkFiles(null))
    .catch(() => {});
}

/**
 * @param {{ version?: string }} remote
 */
export async function syncApkUpdateTrackingWithInstalled(remote) {
  if (!remote?.version) return;
  const { getLocalNativeAppVersion, needsNativeApkUpdate } = await import("./nativeApkUpdate.js");
  const localNative = await getLocalNativeAppVersion();
  if (!needsNativeApkUpdate(remote, localNative)) {
    clearApkUpdateTracking();
    const { deleteCachedApkFiles } = await import("./updateStorageCleanup.js");
    await deleteCachedApkFiles(null);
  }
}

/**
 * APK was downloaded and is waiting for the user to install from the system dialog.
 * @param {{ version?: string }} remote
 */
export async function isApkWaitingForInstall(remote) {
  if (!remote?.version) return false;
  await syncApkUpdateTrackingWithInstalled(remote);
  const { getLocalNativeAppVersion, needsNativeApkUpdate } = await import("./nativeApkUpdate.js");
  const localNative = await getLocalNativeAppVersion();
  if (!needsNativeApkUpdate(remote, localNative)) return false;
  return isApkDownloadedForVersion(remote.version);
}

/**
 * @param {{ version?: string }} remote
 */
export async function isApkInstallPendingForRemote(remote) {
  return isApkWaitingForInstall(remote);
}

/** Close the WebView after launching the system APK installer so it cannot loop in the background. */
export async function tryExitAppAfterApkInstall() {
  try {
    const { App } = await import("@capacitor/app");
    await App.exitApp();
  } catch {
    /* best effort */
  }
}
