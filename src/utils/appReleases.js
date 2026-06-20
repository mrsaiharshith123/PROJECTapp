import { assetUrl } from "./basePath.js";
import { apkDownloadLinkProps } from "./apkDownload.js";
import { compareSemver } from "./updateServer.js";

const GH_RELEASE_APK =
  "https://github.com/mrsaiharshith123/PROJECTapp/releases/latest/download/Perovo-dev-latest.apk";
const GH_PAGES = "https://mrsaiharshith123.github.io/PROJECTapp/";

/**
 * @typedef {{ version: string, builtAt?: string, label?: string, androidApkUrl?: string, webUrl?: string }} AppRelease
 */

/** @returns {string} */
export function getAppReleasesManifestUrl() {
  return assetUrl("app-releases.json");
}

/**
 * @returns {Promise<{ version?: string, builtAt?: string, bundleUrl?: string, bundleSize?: number } | null>}
 */
export async function fetchSiteVersionInfo() {
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
 * @returns {Promise<AppRelease[]>}
 */
export async function fetchAppReleases() {
  if (typeof fetch === "undefined") return [];
  try {
    const [releasesRes, siteInfo] = await Promise.all([
      fetch(getAppReleasesManifestUrl(), { cache: "no-store" }),
      fetchSiteVersionInfo(),
    ]);
    if (!releasesRes.ok) return getFallbackReleases();
    const data = await releasesRes.json();
    let list = Array.isArray(data?.releases) ? data.releases : [];
    if (!list.length) return getFallbackReleases();
    if (siteInfo?.builtAt) {
      list = list.map((row) => {
        if (row.version === siteInfo.version && !row.builtAt) {
          return { ...row, builtAt: siteInfo.builtAt };
        }
        return row;
      });
    }
    return [...list].sort((a, b) => compareSemver(b.version, a.version));
  } catch {
    return getFallbackReleases();
  }
}

/** @returns {AppRelease[]} */
function getFallbackReleases() {
  return [
    {
      version: "1.0.0",
      label: "1.0.0 — latest",
      androidApkUrl: GH_RELEASE_APK,
      webUrl: GH_PAGES,
    },
  ];
}

/** @param {string} url @param {string} [version] */
export function triggerApkDownload(url, version) {
  let resolved;
  try {
    resolved = new URL(url, window.location.href);
  } catch {
    window.location.assign(url);
    return;
  }

  const mobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isApk = /\.apk(\?|$)/i.test(resolved.pathname);

  // Chrome on Android stalls at 100% with download attribute / new tab — navigate directly.
  if (mobile && isApk) {
    window.location.assign(resolved.href);
    return;
  }

  const props = apkDownloadLinkProps(url);
  if (props.download) {
    const a = document.createElement("a");
    a.href = url;
    a.download = version ? `Perovo-${version}.apk` : props.download;
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  window.location.assign(resolved.href);
}
