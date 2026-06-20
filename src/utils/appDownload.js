import { assetUrl } from "./basePath.js";
import { getApkDownloadUrl, apkDownloadLinkProps } from "./apkDownload.js";

export const INSTALL_OPT_IN_KEY = "perovo_install_opt_in";
export const INSTALL_PLATFORM_KEY = "perovo_install_platform";
export const INSTALL_OPT_IN_EVENT = "perovo-install-opt-in";

/** @typedef {"windows" | "android" | "ios"} InstallPlatform */

const GH_IOS_RELEASE =
  "https://github.com/mrsaiharshith123/PROJECTapp/releases/latest";

/**
 * User chose a download path — unlock PWA install UI only for Windows.
 * @param {InstallPlatform} platform
 */
export function requestInstallPlatform(platform) {
  try {
    localStorage.setItem(INSTALL_OPT_IN_KEY, "1");
    localStorage.setItem(INSTALL_PLATFORM_KEY, platform);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(INSTALL_OPT_IN_EVENT));
  }
}

export function readInstallOptIn() {
  try {
    return localStorage.getItem(INSTALL_OPT_IN_KEY) === "1";
  } catch {
    return false;
  }
}

/** @returns {InstallPlatform | ""} */
export function readInstallPlatform() {
  try {
    const p = localStorage.getItem(INSTALL_PLATFORM_KEY);
    return p === "windows" || p === "android" || p === "ios" ? p : "";
  } catch {
    return "";
  }
}

export function clearInstallOptIn() {
  try {
    localStorage.removeItem(INSTALL_OPT_IN_KEY);
    localStorage.removeItem(INSTALL_PLATFORM_KEY);
  } catch {
    /* ignore */
  }
}

export function getAndroidDownloadUrl() {
  return getApkDownloadUrl();
}

export function getIosDownloadUrl() {
  const configured = import.meta.env.VITE_IOS_DOWNLOAD_URL;
  if (configured) return configured;
  return GH_IOS_RELEASE;
}

/** Same-origin app URL — used for Windows PWA install from the browser. */
export function getWindowsPwaUrl() {
  if (typeof window === "undefined") return assetUrl("");
  const base = import.meta.env.BASE_URL || "/";
  const path = base.endsWith("/") ? base : `${base}/`;
  return `${window.location.origin}${path}`;
}

export { apkDownloadLinkProps };
