/** localStorage key — `on` = landing page, `off` = full app (production web only). */
export const CUSTOMER_MODE_STORAGE_KEY = "perovo_customer_mode";

/** True when running inside a native shell (TWA, Capacitor, or bundled WebView), not a normal browser tab. */
export function isEmbeddedApp() {
  if (typeof window !== "undefined") {
    if (window.__PEROVO_EMBEDDED__) return true;
    if (window.Capacitor?.isNativePlatform?.()) return true;
  }
  return import.meta.env.VITE_EMBEDDED_APP === "1";
}

/**
 * Apply `?app=1` (full app) or `?app=0` (landing) from the URL before React mounts.
 * Call once from main.jsx.
 */
export function bootstrapCustomerModeFromUrl() {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search);
  if (!q.has("app")) return;
  const off = q.get("app") === "1";
  localStorage.setItem(CUSTOMER_MODE_STORAGE_KEY, off ? "off" : "on");
}

/**
 * Customer mode = public landing + download page (not the dashboard).
 * APK / Capacitor always get the full app.
 */
export function isCustomerModeEnabled() {
  if (isEmbeddedApp()) return false;
  if (import.meta.env.DEV) return false;

  const buildMode = import.meta.env.VITE_CUSTOMER_MODE;
  if (buildMode === "0" || buildMode === "false") return false;
  if (buildMode === "1" || buildMode === "true") return true;

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(CUSTOMER_MODE_STORAGE_KEY);
    if (stored === "off") return false;
    if (stored === "on") return true;
  }

  return true;
}

/** @deprecated use isCustomerModeEnabled */
export function isMarketingWeb() {
  return isCustomerModeEnabled();
}

export function setCustomerMode(enabled) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMER_MODE_STORAGE_KEY, enabled ? "on" : "off");
}

export function getCustomerModeLabel() {
  if (isEmbeddedApp()) return "embedded";
  if (import.meta.env.DEV) return "dev-app";
  const buildMode = import.meta.env.VITE_CUSTOMER_MODE;
  if (buildMode === "0" || buildMode === "false") return "build-app";
  if (buildMode === "1" || buildMode === "true") return "build-landing";
  if (typeof window !== "undefined") {
    return localStorage.getItem(CUSTOMER_MODE_STORAGE_KEY) === "off" ? "browser-app" : "browser-landing";
  }
  return "landing";
}
