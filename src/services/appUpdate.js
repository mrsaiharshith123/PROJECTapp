import { isEmbeddedApp } from "../utils/embeddedApp.js";
import {
  getRemoteManifestUrl,
  getUpdateServerBase,
  isRemoteManifestNewer,
  remoteAppUrlWithVersion,
} from "../utils/updateServer.js";
import { applyNativeOtaUpdate, canUseNativeOta, getNativeBundleInfo } from "./nativeOtaUpdate.js";
import {
  applyNativeApkUpdate,
  downloadNativeApk,
  getLocalNativeAppVersion,
  needsNativeApkUpdate,
} from "./nativeApkUpdate.js";
import { getAppliedOtaRecord } from "./appliedOtaMeta.js";
import {
  isApkDownloadedForVersion,
  isApkWaitingForInstall,
  syncApkUpdateTrackingWithInstalled,
} from "./pendingApkInstall.js";

const LOCAL_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";
const LOCAL_BUILT_AT = import.meta.env.VITE_APP_BUILT_AT || "";

/**
 * @typedef {{ phase?: string, percent?: number, bytesLoaded?: number, bytesTotal?: number }} UpdateProgress
 * @typedef {{ version?: string, builtAt?: string, appUrl?: string, bundleUrl?: string, bundleSize?: number, apkUrl?: string, apkSize?: number, releaseNotes?: string }} UpdateManifest
 * @typedef {{ status: "current" | "available" | "unknown" | "apk_ready" | "apk_pending", updateKind?: "apk" | "ota", localVersion: string, localNativeVersion?: string, remoteVersion?: string, builtAt?: string, releaseNotes?: string, bundleUrl?: string, bundleSize?: number, apkUrl?: string, apkSize?: number, apkDownloaded?: boolean, needsApk?: boolean, needsOta?: boolean }} UpdateCheckResult
 */

export async function fetchRemoteManifest() {
  if (typeof fetch === "undefined") return null;
  try {
    const res = await fetch(getRemoteManifestUrl(), { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function resolveLocalState() {
  let version = LOCAL_VERSION;
  let builtAt = LOCAL_BUILT_AT;
  if (canUseNativeOta()) {
    const bundle = await getNativeBundleInfo();
    const bv = bundle?.version ? String(bundle.version) : "";
    if (bv && bv !== "builtin" && bv !== "0.0.0") version = bv;
  }
  const applied = getAppliedOtaRecord();
  if (applied?.version === version && applied.builtAt) builtAt = applied.builtAt;
  return { version, builtAt };
}

/**
 * @returns {Promise<UpdateCheckResult>}
 */
export async function checkForAppUpdate() {
  const [remote, local, localNative] = await Promise.all([
    fetchRemoteManifest(),
    resolveLocalState(),
    getLocalNativeAppVersion(),
  ]);

  if (!remote?.version) {
    return { status: "unknown", localVersion: local.version, localNativeVersion: localNative };
  }

  await syncApkUpdateTrackingWithInstalled(remote);

  const apkNeeded = needsNativeApkUpdate(remote, localNative);
  const applied = getAppliedOtaRecord();
  let otaNeeded = isRemoteManifestNewer(remote, local.version, local.builtAt);
  if (
    otaNeeded &&
    applied?.version === remote.version &&
    applied?.builtAt &&
    remote.builtAt &&
    applied.builtAt === remote.builtAt
  ) {
    otaNeeded = false;
  }

  const apkDownloaded = apkNeeded && isApkDownloadedForVersion(remote.version);
  const apkWaiting = apkNeeded && (apkDownloaded || (await isApkWaitingForInstall(remote)));

  /** @type {"apk" | "ota" | undefined} */
  const updateKind = otaNeeded ? "ota" : apkNeeded ? "apk" : undefined;

  const base = {
    localVersion: local.version,
    localNativeVersion: localNative,
    remoteVersion: remote.version,
    builtAt: remote.builtAt,
    releaseNotes: remote.releaseNotes,
    bundleUrl: remote.bundleUrl,
    bundleSize: remote.bundleSize,
    apkUrl: remote.apkUrl,
    apkSize: remote.apkSize,
    apkDownloaded,
    needsApk: apkNeeded,
    needsOta: otaNeeded,
    updateKind,
  };

  if (apkWaiting) return { status: "apk_ready", ...base };
  if (!apkNeeded && !otaNeeded) return { status: "current", ...base };
  return { status: "available", ...base };
}

/**
 * @param {{ onProgress?: (p: UpdateProgress) => void, allowApk?: boolean }} [opts]
 */
export async function applyAppUpdate({ onProgress, allowApk = true } = {}) {
  onProgress?.({ phase: "checking", percent: 0 });

  const remote = await fetchRemoteManifest();
  if (!remote?.version) throw new Error("manifest_missing");

  const [local, localNative] = await Promise.all([resolveLocalState(), getLocalNativeAppVersion()]);
  const apkNeeded = needsNativeApkUpdate(remote, localNative);
  const applied = getAppliedOtaRecord();
  let otaNeeded = isRemoteManifestNewer(remote, local.version, local.builtAt);
  if (
    otaNeeded &&
    applied?.version === remote.version &&
    applied?.builtAt &&
    remote.builtAt &&
    applied.builtAt === remote.builtAt
  ) {
    otaNeeded = false;
  }

  if (isEmbeddedApp()) {
    if (canUseNativeOta() && remote.bundleUrl && otaNeeded) {
      await applyNativeOtaUpdate(
        {
          version: remote.version,
          builtAt: remote.builtAt,
          bundleUrl: remote.bundleUrl,
          bundleSize: remote.bundleSize,
        },
        onProgress,
      );
      return { kind: "ota" };
    }

    if (apkNeeded && allowApk) {
      if (isApkDownloadedForVersion(remote.version)) {
        await applyNativeApkUpdate(remote, onProgress);
        return { kind: "apk" };
      }
      await downloadNativeApk(remote, onProgress);
      return { kind: "apk_downloaded" };
    }

    if (apkNeeded && !allowApk) return { kind: "apk_deferred" };
  }

  await applyWebOrPwaUpdate(remote, onProgress);
  return { kind: "ota" };
}

/**
 * @param {UpdateManifest} remote
 * @param {(p: UpdateProgress) => void} [onProgress]
 */
async function applyWebOrPwaUpdate(remote, onProgress) {
  onProgress?.({ phase: "downloading", percent: 40 });
  await unregisterServiceWorkers();
  onProgress?.({ phase: "restarting", percent: 100 });
  const base = remote?.appUrl || getUpdateServerBase();
  const target = remote?.version ? remoteAppUrlWithVersion(remote.version, base) : base;
  window.location.assign(target);
  window.setTimeout(() => {
    window.location.href = target;
  }, 1500);
}

async function unregisterServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
}

export function getLocalAppVersion() {
  return LOCAL_VERSION;
}
