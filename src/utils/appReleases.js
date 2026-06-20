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
 * @returns {Promise<AppRelease[]>}
 */
export async function fetchAppReleases() {
  if (typeof fetch === "undefined") return [];
  try {
    const res = await fetch(getAppReleasesManifestUrl(), { cache: "no-store" });
    if (!res.ok) return getFallbackReleases();
    const data = await res.json();
    const list = Array.isArray(data?.releases) ? data.releases : [];
    if (!list.length) return getFallbackReleases();
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
  window.open(url, "_blank", "noopener,noreferrer");
}
