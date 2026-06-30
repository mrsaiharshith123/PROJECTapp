import { isEmbeddedApp } from "./embeddedApp.js";

/**
 * GitHub Pages marketing root (one level above the SPA when deployed at /PROJECTapp/app/).
 */
export function getMarketingLandingUrl() {
  if (typeof window === "undefined") return "/";

  const base = import.meta.env.BASE_URL || "/";
  const landingPath = base.includes("/app")
    ? base.replace(/\/?app\/?$/, "/")
    : base;

  return new URL(landingPath, window.location.origin).href;
}

/**
 * Browser tab on the Pages web deploy — show marketing, not the in-app login gate.
 * Native APK / Capacitor and local dev keep the normal auth flow.
 */
export function shouldBrowserUseMarketingLanding() {
  if (import.meta.env.DEV) return false;
  if (isEmbeddedApp()) return false;

  const base = import.meta.env.BASE_URL || "/";
  return /\/app\/?$/.test(base);
}
