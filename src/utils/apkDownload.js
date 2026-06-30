import { assetUrl } from "./basePath.js";
import { getDeviceInfo } from "./deviceInfo.js";
import { isEmbeddedApp } from "./embeddedApp.js";
import { getUpdateServerBase } from "./updateServer.js";

const GH_RELEASE_APK =
  "https://github.com/mrsaiharshith123/PROJECTapp/releases/latest/download/Perovo-dev-latest.apk";

/** Same-origin APK mirrored on GitHub Pages (see deploy-pages workflow). */
export function getPagesApkUrl() {
  const base = getUpdateServerBase();
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${normalized}apk/Perovo-dev-latest.apk`;
}

/**
 * Best APK URL for the current context.
 * Mobile browsers should prefer same-origin Pages APK — GitHub release redirects often hang at 100%.
 */
export function getApkDownloadUrl() {
  const configured = import.meta.env.VITE_APK_DOWNLOAD_URL;
  if (configured) return configured;

  if (isEmbeddedApp()) {
    return getPagesApkUrl();
  }

  if (import.meta.env.PROD && typeof window !== "undefined") {
    try {
      return new URL(assetUrl("apk/Perovo-dev-latest.apk"), window.location.origin).href;
    } catch {
      return getPagesApkUrl();
    }
  }

  return GH_RELEASE_APK;
}

/**
 * Start an APK download. On Android phones, top-level navigation is the only reliable path.
 * @param {string} [url]
 */
export function triggerApkDownload(url = getApkDownloadUrl()) {
  if (typeof window === "undefined") return;

  const absolute = url.startsWith("http")
    ? url
    : new URL(url, window.location.href).href;
  const sep = absolute.includes("?") ? "&" : "?";
  const busted = `${absolute}${sep}_t=${Date.now()}`;

  const { formFactor, os } = getDeviceInfo();
  const onAndroidPhone = formFactor === "mobile" && os.family === "android";

  if (onAndroidPhone) {
    window.location.assign(busted);
    return;
  }

  const anchor = document.createElement("a");
  anchor.href = busted;
  anchor.rel = "noopener";
  anchor.download = "Perovo-dev-latest.apk";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
