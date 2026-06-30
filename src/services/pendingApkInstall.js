import { compareSemver } from "../utils/updateServer.js";
import { getLocalNativeAppVersion, needsNativeApkUpdate } from "./nativeApkUpdate.js";

const STORAGE_KEY = "perovo_apk_install_pending";
const STALE_PENDING_MS = 6 * 60 * 60 * 1000;

/**
 * @returns {{ version: string, at: string } | null}
 */
export function getPendingApkInstall() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.version) return null;
    return { version: String(parsed.version), at: parsed.at ? String(parsed.at) : "" };
  } catch {
    return null;
  }
}

/** @param {string} version */
export function markApkInstallPending(version) {
  if (!version) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: String(version), at: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

export function clearPendingApkInstall() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function isPendingStale(pending) {
  if (!pending?.at) return false;
  const elapsed = Date.now() - new Date(pending.at).getTime();
  return elapsed > STALE_PENDING_MS;
}

/**
 * True when we already handed an APK to the system installer and the shell is still old.
 * @param {{ version?: string }} remote
 */
export async function isApkInstallPendingForRemote(remote) {
  const pending = getPendingApkInstall();
  if (!pending?.version || !remote?.version) return false;

  if (isPendingStale(pending)) {
    clearPendingApkInstall();
    return false;
  }

  const localNative = await getLocalNativeAppVersion();
  if (!needsNativeApkUpdate(remote, localNative)) {
    clearPendingApkInstall();
    return false;
  }

  return compareSemver(pending.version, remote.version) >= 0;
}

/** Close the WebView after launching the system APK installer so it cannot loop in the background. */
export async function tryExitAppAfterApkInstall() {
  try {
    const { App } = await import("@capacitor/app");
    await App.exitApp();
  } catch {
    /* best effort — installer intent may already have paused the activity */
  }
}
