import { compareSemver } from "../utils/updateServer.js";
import { getApkDownloadUrl } from "../utils/apkDownload.js";
import { canUseNativeOta } from "./nativeOtaUpdate.js";

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

/**
 * Download APK and open the system installer (replaces app in place — no uninstall).
 * @param {{ version?: string, apkUrl?: string, apkSize?: number }} manifest
 * @param {(p: { phase?: string, percent?: number, bytesLoaded?: number, bytesTotal?: number }) => void} [onProgress]
 */
export async function applyNativeApkUpdate(manifest, onProgress) {
  const url = manifest.apkUrl || getApkDownloadUrl();
  if (!url) throw new Error("apk_missing");

  const { markApkInstallPending, clearPendingApkInstall } = await import("./pendingApkInstall.js");
  markApkInstallPending(manifest.version || "latest");

  onProgress?.({ phase: "downloading", percent: 0 });

  try {
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
    const fileName = `perovo-update-${manifest.version || "latest"}.apk`;

    await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    const { uri } = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    onProgress?.({ phase: "installing", percent: 100 });

    const { FileOpener } = await import("@capacitor-community/file-opener");
    await FileOpener.open({
      filePath: uri,
      contentType: "application/vnd.android.package-archive",
      openWithDefault: true,
    });

    const { tryExitAppAfterApkInstall } = await import("./pendingApkInstall.js");
    await tryExitAppAfterApkInstall();
  } catch (err) {
    clearPendingApkInstall();
    throw err;
  }
}
