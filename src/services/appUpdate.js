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
  getLocalNativeAppVersion,
  needsNativeApkUpdate,
} from "./nativeApkUpdate.js";
import { getAppliedOtaRecord } from "./appliedOtaMeta.js";
import { isApkInstallPendingForRemote } from "./pendingApkInstall.js";

/** @type {Promise<UpdateCheckResult> | null} */
let _cachedCheck = null;

const LOCAL_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";
const LOCAL_BUILT_AT = import.meta.env.VITE_APP_BUILT_AT || "";

const SW_WAIT_MS = 12000;

/**
 * @typedef {"checking"|"downloading"|"restarting"|"current"|"available"|"unknown"} UpdatePhase
 * @typedef {{ phase?: UpdatePhase | string, percent?: number, bytesLoaded?: number, bytesTotal?: number }} UpdateProgress
 * @typedef {{ version?: string, builtAt?: string, appUrl?: string, bundleUrl?: string, bundleSize?: number, apkUrl?: string, apkSize?: number, releaseNotes?: string }} UpdateManifest
 * @typedef {{ status: "current" | "available" | "unknown", updateKind?: "apk" | "ota", localVersion: string, localNativeVersion?: string, remoteVersion?: string, builtAt?: string, releaseNotes?: string, bundleUrl?: string, bundleSize?: number, apkUrl?: string }} UpdateCheckResult
 */

/**
 * @returns {Promise<UpdateManifest | null>}
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

/** Installed copy — Capgo bundle version when on native OTA, else build-time env. */
async function resolveLocalUpdateState() {
  let version = LOCAL_VERSION;
  let builtAt = LOCAL_BUILT_AT;

  if (canUseNativeOta()) {
    const bundle = await getNativeBundleInfo();
    const bundleVersion = bundle?.version ? String(bundle.version) : "";
    if (bundleVersion && bundleVersion !== "builtin" && bundleVersion !== "0.0.0") {
      version = bundleVersion;
    }
  }

  const applied = getAppliedOtaRecord();
  if (applied?.version === version && applied.builtAt) {
    builtAt = applied.builtAt;
  }

  return { version, builtAt };
}

/**
 * @returns {Promise<UpdateCheckResult>}
 */
export async function checkForAppUpdate() {
  const remote = await fetchRemoteManifest();
  const local = await resolveLocalUpdateState();
  const localNative = await getLocalNativeAppVersion();

  if (!remote?.version) {
    return { status: "unknown", localVersion: local.version, localNativeVersion: localNative };
  }

  const apkNeeded = needsNativeApkUpdate(remote, localNative);
  const otaNeeded = isRemoteManifestNewer(remote, local.version, local.builtAt);
  const apkPending = apkNeeded ? await isApkInstallPendingForRemote(remote) : false;

  const base = {
    localVersion: local.version,
    localNativeVersion: localNative,
    remoteVersion: remote.version,
    builtAt: remote.builtAt,
    releaseNotes: remote.releaseNotes,
    bundleUrl: remote.bundleUrl,
    bundleSize: remote.bundleSize,
    apkUrl: remote.apkUrl,
    updateKind: otaNeeded ? "ota" : apkNeeded && !apkPending ? "apk" : undefined,
    apkInstallPending: apkPending,
    needsApk: apkNeeded && !apkPending,
    needsOta: otaNeeded,
  };

  if (apkPending) {
    return { status: "apk_pending", ...base };
  }

  if (!apkNeeded && !otaNeeded) {
    return { status: "current", ...base };
  }

  return { status: "available", ...base };
}

/** Debounced update check — once per cold JS session (always reuses real check result). */
export async function checkForAppUpdateOnce() {
  if (!_cachedCheck) {
    _cachedCheck = checkForAppUpdate();
  }
  return _cachedCheck;
}

/**
 * @param {ServiceWorkerRegistration} reg
 * @param {number} [timeoutMs]
 */
function waitForServiceWorkerActivation(reg, timeoutMs = SW_WAIT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    };

    const timer = window.setTimeout(() => finish(false), timeoutMs);

    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      finish(true);
      return;
    }

    const worker = reg.installing;
    if (!worker) {
      finish(false);
      return;
    }

    worker.addEventListener("statechange", () => {
      if (worker.state !== "installed") return;
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      finish(true);
    });
  });
}

/**
 * @param {(p: UpdateProgress) => void} [onProgress]
 */
async function applyPwaUpdate(onProgress) {
  onProgress?.({ phase: "downloading", percent: 0 });
  await unregisterServiceWorkers();
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      onProgress?.({ phase: "downloading", percent: 60 });
      await waitForServiceWorkerActivation(reg);
    }
  }
  onProgress?.({ phase: "restarting", percent: 100 });
  window.location.reload();
}

async function unregisterServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)));
}

/**
 * Browser tab — clear stale SW caches, then hard-navigate to the latest deploy.
 * OTA zip bundles are only for native Capgo; streaming them in a browser tab
 * wastes bandwidth and often hangs at 100% on mobile Chrome.
 * @param {UpdateManifest} remote
 * @param {(p: UpdateProgress) => void} [onProgress]
 */
async function applyWebStaticUpdate(remote, onProgress) {
  const base = remote.appUrl || getUpdateServerBase();
  const targetUrl = remoteAppUrlWithVersion(remote.version, base);

  onProgress?.({ phase: "downloading", percent: 40 });
  await unregisterServiceWorkers();

  onProgress?.({ phase: "restarting", percent: 100 });

  window.location.assign(targetUrl);
  window.setTimeout(() => {
    window.location.href = targetUrl;
  }, 1500);
}

/**
 * @param {UpdateManifest} remote
 * @param {(p: UpdateProgress) => void} [onProgress]
 * @param {{ allowApk?: boolean }} [opts]
 */
async function applyEmbeddedUpdate(remote, onProgress, opts = {}) {
  const { allowApk = false } = opts;
  onProgress?.({ phase: "checking", percent: 0 });

  const local = await resolveLocalUpdateState();
  const localNative = await getLocalNativeAppVersion();
  const apkNeeded = needsNativeApkUpdate(remote, localNative);
  const otaNeeded = isRemoteManifestNewer(remote, local.version, local.builtAt);

  if (canUseNativeOta() && remote.bundleUrl && otaNeeded) {
    await applyNativeOtaUpdate(
      {
        version: remote.version || LOCAL_VERSION,
        builtAt: remote.builtAt,
        bundleUrl: remote.bundleUrl,
        bundleSize: remote.bundleSize,
      },
      onProgress,
    );
    return { kind: "ota" };
  }

  if (apkNeeded && allowApk) {
    await applyNativeApkUpdate(remote, onProgress);
    return { kind: "apk" };
  }

  if (apkNeeded && !allowApk) {
    return { kind: "apk_deferred" };
  }

  await applyPwaUpdate(onProgress);
  return { kind: "ota" };
}

/**
 * Check server, download update in-app, restart.
 * @param {{ onProgress?: (p: UpdateProgress) => void, force?: boolean, allowApk?: boolean }} [opts]
 */
export async function applyAppUpdate(opts = {}) {
  const { onProgress, force = false, allowApk = false } = opts;
  onProgress?.({ phase: "checking", percent: 0 });

  const remote = await fetchRemoteManifest();
  const local = await resolveLocalUpdateState();
  const localNative = await getLocalNativeAppVersion();
  const apkNeeded = remote && needsNativeApkUpdate(remote, localNative);
  const otaNeeded = remote && isRemoteManifestNewer(remote, local.version, local.builtAt);
  const apkPending = remote && apkNeeded ? await isApkInstallPendingForRemote(remote) : false;

  if (!force && remote?.version && !apkNeeded && !otaNeeded) {
    return { status: "current" };
  }

  if (!force && apkPending) {
    return { status: "apk_pending" };
  }

  if (isEmbeddedApp()) {
    if (remote) {
      const result = await applyEmbeddedUpdate(remote, onProgress, { allowApk });
      if (result.kind === "apk_deferred") {
        return { status: "apk_deferred" };
      }
      return { status: result.kind === "apk" ? "apk_install" : "restarting" };
    }
    throw new Error("manifest_missing");
  }

  if (remote) {
    await applyWebStaticUpdate(remote, onProgress);
  } else {
    await applyPwaUpdate(onProgress);
  }
  return { status: "restarting" };
}

export function getLocalAppVersion() {
  return LOCAL_VERSION;
}
