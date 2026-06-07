import { trackProductEvent } from "./analyticsHub.js";

/**
 * Public analytics API — use this from app code (never insert app_events directly).
 * @param {string} eventName
 * @param {{ module?: string, step?: string, properties?: Record<string, unknown> }} [opts]
 */
export function trackEvent(eventName, opts) {
  trackProductEvent(eventName, opts);
}
