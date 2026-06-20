import { isEmbeddedApp } from "../utils/embeddedApp.js";
import {
  compareSemver,
  getRemoteManifestUrl,
} from "../utils/updateServer.js";
import { applyNativeOtaUpdate, canUseNativeOta } from "./nativeOtaUpdate.js";

const LOCAL_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";
const LOCAL_BUILT_AT = import.meta.env.VITE_APP_BUILT_AT || "";

/**
 * @typedef {"checking"|"downloading"|"restarting"|"current"|"available"|"unknown"} UpdatePhase
 * @typedef {{ phase?: UpdatePhase | string, percent?: number, bytesLoaded?: number, bytesTotal?: number }} UpdateProgress
 * @typedef {{ version?: string, builtAt?: string, appUrl?: string, bundleUrl?: string, bundleSize?: number, releaseNotes?: string }} UpdateManifest
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

function manifestIsNewer(remote, localVersion = LOCAL_VERSION, localBuiltAt = LOCAL_BUILT_AT) {
  if (!remote?.version) return false;
  const versionCmp = compareSemver(remote.version, localVersion);
  if (versionCmp > 0) return true;
  if (versionCmp < 0) return false;
  if (remote.builtAt && localBuiltAt) {
    return new Date(remote.builtAt).getTime() > new Date(localBuiltAt).getTime();
  }
  return false;
}

/**
 * @returns {Promise<{ status: "current" | "available" | "unknown", localVersion: string, remoteVersion?: string, builtAt?: string, releaseNotes?: string, bundleUrl?: string, bundleSize?: number }>}
 */
export async function checkForAppUpdate() {
  const remote = await fetchRemoteManifest();
  if (!remote?.version) {
    return { status: "unknown", localVersion: LOCAL_VERSION };
  }

  const base = {
    localVersion: LOCAL_VERSION,
    remoteVersion: remote.version,
    builtAt: remote.builtAt,
    releaseNotes: remote.releaseNotes,
    bundleUrl: remote.bundleUrl,
    bundleSize: remote.bundleSize,
  };

  if (!manifestIsNewer(remote, LOCAL_VERSION)) {
    return { status: "current", ...base };
  }

  return { status: "available", ...base };
}

function waitForServiceWorkerActivation(reg) {
  return new Promise((resolve) => {
    if (reg.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
      resolve(true);
      return;
    }
    const worker = reg.installing;
    if (!worker) {
      resolve(false);
      return;
    }
    worker.addEventListener("statechange", () => {
      if (worker.state !== "installed") return;
      if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      resolve(true);
    });
  });
}

/**
 * @param {(p: UpdateProgress) => void} [onProgress]
 */
async function applyPwaUpdate(onProgress) {
  onProgress?.({ phase: "downloading", percent: 0 });
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

/**
 * @param {UpdateManifest} remote
 * @param {(p: UpdateProgress) => void} [onProgress]
 */
async function applyEmbeddedUpdate(remote, onProgress) {
  onProgress?.({ phase: "checking", percent: 0 });

  if (canUseNativeOta()) {
    if (!remote.bundleUrl) {
      throw new Error("bundle_missing");
    }
    await applyNativeOtaUpdate(
      {
        version: remote.version || LOCAL_VERSION,
        bundleUrl: remote.bundleUrl,
        bundleSize: remote.bundleSize,
      },
      onProgress,
    );
    return;
  }

  await applyPwaUpdate(onProgress);
}

/**
 * Check server, download update in-app, restart.
 * @param {{ onProgress?: (p: UpdateProgress) => void, force?: boolean }} [opts]
 */
export async function applyAppUpdate(opts = {}) {
  const { onProgress, force = false } = opts;
  onProgress?.({ phase: "checking", percent: 0 });

  const remote = await fetchRemoteManifest();
  const hasUpdate = remote && manifestIsNewer(remote, LOCAL_VERSION);

  if (!force && remote?.version && !hasUpdate) {
    return { status: "current" };
  }

  if (isEmbeddedApp()) {
    if (remote) {
      await applyEmbeddedUpdate(remote, onProgress);
      return { status: "restarting" };
    }
    throw new Error("manifest_missing");
  }

  await applyPwaUpdate(onProgress);
  return { status: "restarting" };
}

export function getLocalAppVersion() {
  return LOCAL_VERSION;
}
