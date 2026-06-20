/** True when running inside a native shell (TWA, Capacitor, or bundled WebView), not a normal browser tab. */
export function isEmbeddedApp() {
  if (typeof window !== "undefined") {
    if (window.__PEROVO_EMBEDDED__) return true;
    if (window.Capacitor?.isNativePlatform?.()) return true;
  }
  return import.meta.env.VITE_EMBEDDED_APP === "1";
}
