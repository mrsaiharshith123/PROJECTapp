/** True when running inside a native shell (TWA, Capacitor, or bundled WebView), not a normal browser tab. */
export function isEmbeddedApp() {
  if (typeof window !== "undefined") {
    if (window.__PEROVO_EMBEDDED__) return true;
    if (window.Capacitor?.isNativePlatform?.()) return true;
  }
  return import.meta.env.VITE_EMBEDDED_APP === "1";
}

/**
 * Customer mode = public landing page (not the dashboard).
 * - **localhost (`npm run dev`)**: opt-in via `.env.local` → `VITE_CUSTOMER_MODE=1` (`npm run site:customer-on`)
 * - **GitHub Pages**: always on (production web is landing-only)
 * - **APK / Capacitor**: always off (full app)
 */
export function isCustomerModeEnabled() {
  if (isEmbeddedApp()) return false;
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_CUSTOMER_MODE === "1";
  }
  return true;
}

/** @deprecated use isCustomerModeEnabled */
export function isMarketingWeb() {
  return isCustomerModeEnabled();
}
