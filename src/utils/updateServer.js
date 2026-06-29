import { isEmbeddedApp } from "./embeddedApp.js";

const DEFAULT_GH_PAGES = "https://mrsaiharshith123.github.io/PROJECTapp/";

/** @returns {string} Base URL with trailing slash */
export function getUpdateServerBase() {
  const configured = import.meta.env.VITE_UPDATE_SERVER_URL;
  if (configured) {
    return configured.endsWith("/") ? configured : `${configured}/`;
  }

  if (typeof window !== "undefined" && !isEmbeddedApp()) {
    const base = import.meta.env.BASE_URL || "/";
    const path = base.startsWith("/") ? base : `/${base}`;
    return `${window.location.origin}${path}`.replace(/\/?$/, "/");
  }

  return DEFAULT_GH_PAGES;
}

export function getRemoteManifestUrl() {
  return `${getUpdateServerBase()}app-version.json`;
}

export function getRemoteAppUrl() {
  return getUpdateServerBase();
}

/**
 * @param {string} version
 * @param {string} [appUrl]
 */
export function remoteAppUrlWithVersion(version, appUrl) {
  const base = appUrl || getRemoteAppUrl();
  const normalized = base.endsWith("/") ? base : `${base}/`;
  const sep = normalized.includes("?") ? "&" : "?";
  return `${normalized}${sep}_v=${encodeURIComponent(version)}&_t=${Date.now()}`;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number} positive if a > b
 */
export function compareSemver(a, b) {
  const pa = String(a).split(".").map((n) => Number.parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length, 3);
  for (let i = 0; i < len; i += 1) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

/**
 * True when the remote manifest is a newer build than the installed copy.
 * Same semver + newer builtAt on server counts as an update (OTA hotfix deploys).
 * @param {{ version?: string, builtAt?: string }} remote
 * @param {string} localVersion
 * @param {string} [localBuiltAt]
 */
export function isRemoteManifestNewer(remote, localVersion, localBuiltAt = "") {
  if (!remote?.version) return false;
  const versionCmp = compareSemver(remote.version, localVersion);
  if (versionCmp > 0) return true;
  if (versionCmp < 0) return false;
  if (remote.builtAt) {
    if (!localBuiltAt) return true;
    return new Date(remote.builtAt).getTime() > new Date(localBuiltAt).getTime();
  }
  return false;
}
