import { isEmbeddedApp } from "../utils/embeddedApp.js";
import {
  compareSemver,
  getRemoteAppUrl,
  getRemoteManifestUrl,
  remoteAppUrlWithVersion,
} from "../utils/updateServer.js";

const LOCAL_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";
const LOCAL_BUILT_AT = import.meta.env.VITE_APP_BUILT_AT || "";

/**
 * @typedef {"checking"|"downloading"|"restarting"|"current"|"available"|"unknown"} UpdatePhase
 * @typedef {{ version?: string, builtAt?: string, appUrl?: string, releaseNotes?: string }} UpdateManifest
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

function isOnLiveServer() {
  if (typeof window === "undefined") return false;
  try {
    const live = new URL(getRemoteAppUrl());
    const here = new URL(window.location.href);
    return here.origin === live.origin && here.pathname.startsWith(live.pathname.replace(/\/$/, ""));
  } catch {
    return false;
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
 * @returns {Promise<{ status: "current" | "available" | "unknown", localVersion: string, remoteVersion?: string, builtAt?: string, releaseNotes?: string }>}
 */
export async function checkForAppUpdate() {
  const remote = await fetchRemoteManifest();
  if (!remote?.version) {
    return { status: "unknown", localVersion: LOCAL_VERSION };
  }

  if (!manifestIsNewer(remote, LOCAL_VERSION)) {
    return {
      status: "current",
      localVersion: LOCAL_VERSION,
      remoteVersion: remote.version,
      builtAt: remote.builtAt,
    };
  }

  return {
    status: "available",
    localVersion: LOCAL_VERSION,
    remoteVersion: remote.version,
    builtAt: remote.builtAt,
    releaseNotes: remote.releaseNotes,
  };
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
 * @param {(phase: UpdatePhase) => void} [onPhase]
 */
async function applyLiveWebUpdate(onPhase) {
  onPhase?.("downloading");

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      await waitForServiceWorkerActivation(reg);
    }
  }

  onPhase?.("restarting");
  window.location.reload();
}

/**
 * Load latest web build inside the native shell (no external browser).
 * @param {UpdateManifest} remote
 * @param {(phase: UpdatePhase) => void} [onPhase]
 */
async function applyEmbeddedWebUpdate(remote, onPhase) {
  onPhase?.("downloading");
  const target = remoteAppUrlWithVersion(remote.version || LOCAL_VERSION, remote.appUrl);
  onPhase?.("restarting");
  window.location.replace(target);
}

/**
 * Check server, pull latest build, restart in-app.
 * @param {{ onPhase?: (phase: UpdatePhase) => void, force?: boolean }} [opts]
 * @returns {Promise<{ status: string }>}
 */
export async function applyAppUpdate(opts = {}) {
  const { onPhase, force = false } = opts;
  onPhase?.("checking");

  const remote = await fetchRemoteManifest();
  const hasUpdate = remote && manifestIsNewer(remote, LOCAL_VERSION);

  if (!force && remote?.version && !hasUpdate) {
    return { status: "current" };
  }

  if (isEmbeddedApp() && !isOnLiveServer()) {
    if (remote) {
      await applyEmbeddedWebUpdate(remote, onPhase);
      return { status: "restarting" };
    }
    onPhase?.("restarting");
    window.location.reload();
    return { status: "reloading" };
  }

  await applyLiveWebUpdate(onPhase);
  return { status: "restarting" };
}

export function getLocalAppVersion() {
  return LOCAL_VERSION;
}
