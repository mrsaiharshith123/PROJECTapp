import { compareSemver } from "../utils/updateServer.js";
import { getApkDownloadUrl } from "../utils/apkDownload.js";
import { canUseNativeOta } from "./nativeOtaUpdate.js";
import { markApkDownloaded, isApkDownloadedForVersion } from "./pendingApkInstall.js";

/** Installed APK shell version (not the Capgo OTA bundle version). */
export async function getLocalNativeAppVersion() {
  const fallback = import.meta.env.VITE_APP_VERSION || "0.0.0";
  if (!canUseNativeOta()) return fallback;
  try {
    const { App } = await import("@capacitor/app");
    const info = await App.getInfo();
    return info?.version ? String(info.version) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * @param {{ version?: string, apkUrl?: string }} remote
 * @param {string} localNativeVersion
 */
export function needsNativeApkUpdate(remote, localNativeVersion) {
  if (!remote?.version) return false;
  if (compareSemver(remote.version, localNativeVersion) <= 0) return false;
  return Boolean(remote.apkUrl || getApkDownloadUrl());
}

/**
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("apk_encode_failed"));
        return;
      }
      resolve(dataUrl.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("apk_encode_failed"));
    reader.readAsDataURL(blob);
  });
}

/** @param {string} version */
export function apkCacheFileName(version) {
  return `perovo-update-${version || "latest"}.apk`;
}

/** Re-open a downloaded APK in the system installer (no re-download). */
export async function openCachedApkInstall(version) {
  const fileName = apkCacheFileName(version);
  const {
    markApkInstallPending,
    markApkPermissionRequested,
    wasApkPermissionRequested,
    clearApkPermissionRequested,
    clearApkUpdateTracking,
  } = await import("./pendingApkInstall.js");

  markApkInstallPending(version || "latest");

  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { uri } = await Filesystem.getUri({
    path: fileName,
    directory: Directory.Cache,
  });

  const { FileOpener } = await import("@capacitor-community/file-opener");

  async function launchInstaller() {
    await FileOpener.open({
      filePath: uri,
      contentType: "application/vnd.android.package-archive",
      openWithDefault: true,
    });
  }

  try {
    await launchInstaller();
  } catch {
    markApkPermissionRequested(version || "latest");
    const { App } = await import("@capacitor/app");
    await App.minimizeApp().catch(() => {});
    return;
  }

  const { App } = await import("@capacitor/app");

  let stateHandle = null;
  stateHandle = await App.addListener("appStateChange", async (state) => {
    if (!state.isActive) return;

    stateHandle?.remove?.();
    stateHandle = null;

    const localNative = await getLocalNativeAppVersion();
    const stillNeeds = needsNativeApkUpdate({ version }, localNative);

    if (!stillNeeds) {
      clearApkPermissionRequested();
      clearApkUpdateTracking();
      return;
    }

    if (wasApkPermissionRequested(version || "latest")) {
      clearApkPermissionRequested();
      try {
        await launchInstaller();
        await App.minimizeApp().catch(() => {});
      } catch {
        /* permission still denied — UI retry */
      }
    }
  });

  await App.minimizeApp().catch(() => {});
}

/**
 * Download APK to cache only — does not open the installer.
 * @param {{ version?: string, apkUrl?: string, apkSize?: number }} manifest
 * @param {(p: { phase?: string, percent?: number, bytesLoaded?: number, bytesTotal?: number }) => void} [onProgress]
 */
export async function downloadNativeApk(manifest, onProgress) {
  const version = manifest.version || "latest";
  if (isApkDownloadedForVersion(version)) {
    onProgress?.({ phase: "downloading", percent: 100 });
    return;
  }

  const url = manifest.apkUrl || getApkDownloadUrl();
  if (!url) throw new Error("apk_missing");

  onProgress?.({ phase: "downloading", percent: 0 });

  const sep = url.includes("?") ? "&" : "?";
  const response = await fetch(`${url}${sep}_t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("apk_download_failed");

  const contentLength = response.headers.get("Content-Length");
  const total = manifest.apkSize || (contentLength ? Number.parseInt(contentLength, 10) : 0);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("apk_download_failed");

  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    const percent = total
      ? Math.min(100, Math.round((received / total) * 100))
      : Math.min(99, Math.round(received / 50000));
    onProgress?.({
      phase: "downloading",
      percent,
      bytesLoaded: received,
      bytesTotal: total || undefined,
    });
  }

  const blob = new Blob(chunks, { type: "application/vnd.android.package-archive" });
  const base64 = await blobToBase64(blob);

  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const fileName = apkCacheFileName(version);

  await Filesystem.writeFile({
    path: fileName,
    data: base64,
    directory: Directory.Cache,
  });

  markApkDownloaded(version);
  const { invalidateUpdateCheckCache } = await import("./appUpdate.js");
  invalidateUpdateCheckCache();
  onProgress?.({ phase: "installing", percent: 100 });
}

/**
 * Download if needed, then open the system installer.
 * @param {{ version?: string, apkUrl?: string, apkSize?: number }} manifest
 * @param {(p: { phase?: string, percent?: number, bytesLoaded?: number, bytesTotal?: number }) => void} [onProgress]
 */
export async function applyNativeApkUpdate(manifest, onProgress) {
  await downloadNativeApk(manifest, onProgress);
  await openCachedApkInstall(manifest.version || "latest");
}
