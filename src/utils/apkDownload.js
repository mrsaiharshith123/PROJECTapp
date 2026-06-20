import { assetUrl } from "./basePath.js";

const GH_RELEASE_APK =
  "https://github.com/mrsaiharshith123/PROJECTapp/releases/latest/download/Perovo-dev-latest.apk";

/**
 * APK download URL for landing / confirm pages.
 * Production GitHub Pages serves `dist/apk/` (see deploy-pages workflow).
 * Do not use the HTML `download` attribute — cross-origin GitHub redirects stall in Chrome.
 */
export function getApkDownloadUrl() {
  const configured = import.meta.env.VITE_APK_DOWNLOAD_URL;
  if (configured) return configured;
  if (import.meta.env.PROD) {
    return assetUrl("apk/Perovo-dev-latest.apk");
  }
  return GH_RELEASE_APK;
}

/** Safe link props for APK — same-origin uses `download`; cross-origin opens in a new tab. */
export function apkDownloadLinkProps(url) {
  try {
    const resolved = new URL(url, window.location.href);
    if (resolved.origin === window.location.origin) {
      return { download: "Perovo-dev-latest.apk" };
    }
  } catch {
    /* fall through */
  }
  return { target: "_blank", rel: "noopener noreferrer" };
}
