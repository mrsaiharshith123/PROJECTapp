import { assetUrl } from "../utils/basePath.js";
import { isEmbeddedApp } from "../utils/embeddedApp.js";
import { getAndroidDownloadUrl } from "../utils/appDownload.js";

const LOCAL_VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";

/**
 * @returns {Promise<{ version?: string, builtAt?: string } | null>}
 */
export async function fetchRemoteVersion() {
  if (typeof fetch === "undefined") return null;
  try {
    const res = await fetch(assetUrl("app-version.json"), { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<{ status: "current" | "available" | "unknown", localVersion: string, remoteVersion?: string, builtAt?: string }>}
 */
export async function checkForAppUpdate() {
  const remote = await fetchRemoteVersion();
  if (!remote?.version) {
    return { status: "unknown", localVersion: LOCAL_VERSION };
  }
  if (remote.version === LOCAL_VERSION) {
    return { status: "current", localVersion: LOCAL_VERSION, remoteVersion: remote.version };
  }
  return {
    status: "available",
    localVersion: LOCAL_VERSION,
    remoteVersion: remote.version,
    builtAt: remote.builtAt,
  };
}

async function activateWaitingServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  await reg.update();
  if (reg.waiting) {
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
    return true;
  }
  return Boolean(reg.installing);
}

/**
 * Pull latest web build from server (PWA) or open native download when needed.
 * @returns {Promise<{ status: string }>}
 */
export async function applyAppUpdate() {
  if (isEmbeddedApp()) {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    if (/android/i.test(ua)) {
      window.open(getAndroidDownloadUrl(), "_blank", "noopener,noreferrer");
      return { status: "opened-download" };
    }
    window.location.reload();
    return { status: "reloading" };
  }

  await activateWaitingServiceWorker();
  window.location.reload();
  return { status: "reloading" };
}

export function getLocalAppVersion() {
  return LOCAL_VERSION;
}
