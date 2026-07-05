import { apkCacheFileName } from "./nativeApkUpdate.js";

const APK_PREFIX = "perovo-update-";

/**
 * Remove downloaded APK installers (External + legacy Data/Cache). Keeps one version if provided.
 * @param {string | null} [keepVersion]
 */
export async function deleteCachedApkFiles(keepVersion = null) {
  if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform?.()) return;

  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const keepName = keepVersion ? apkCacheFileName(keepVersion) : null;

  for (const directory of [Directory.External, Directory.Data, Directory.Cache]) {
    try {
      const { files } = await Filesystem.readdir({ path: "", directory });
      for (const entry of files || []) {
        const name = entry.name || entry;
        if (typeof name !== "string") continue;
        if (!name.startsWith(APK_PREFIX) || !name.endsWith(".apk")) continue;
        if (keepName && name === keepName) continue;
        await Filesystem.deleteFile({ path: name, directory }).catch(() => {});
      }
    } catch {
      /* directory empty or unavailable */
    }
  }
}

/** Drop stale APK installers on boot; Capgo handles OTA bundle pruning via autoDeletePrevious. */
export async function cleanupUpdateStorageOnBoot() {
  if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform?.()) return;

  try {
    const { fetchRemoteManifest } = await import("./appUpdate.js");
    const { getLocalNativeAppVersion, needsNativeApkUpdate } = await import("./nativeApkUpdate.js");
    const { getApkDownloadedRecord } = await import("./pendingApkInstall.js");

    const remote = await fetchRemoteManifest();
    const localNative = await getLocalNativeAppVersion();
    const apkStillNeeded = remote?.version && needsNativeApkUpdate(remote, localNative);
    const pending = getApkDownloadedRecord();

    if (apkStillNeeded && pending?.version) {
      await deleteCachedApkFiles(pending.version);
      return;
    }

    await deleteCachedApkFiles(null);
  } catch {
    /* non-blocking */
  }
}
