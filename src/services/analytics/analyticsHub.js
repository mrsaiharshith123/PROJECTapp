import { createSupabaseAnalyticsProvider } from "./providers/supabaseProvider.js";

/** @typedef {{ name: string, track: (event: string, opts?: object) => void | Promise<void> }} AnalyticsProvider */

/** @type {AnalyticsProvider[]} */
const extraProviders = [];

/** @type {AnalyticsProvider | null} */
let primaryProvider = null;

/**
 * Register optional external providers (PostHog, Plausible, etc.).
 * @param {AnalyticsProvider} provider
 */
export function registerAnalyticsProvider(provider) {
  if (!provider?.name || typeof provider.track !== "function") return;
  if (extraProviders.some((p) => p.name === provider.name)) return;
  extraProviders.push(provider);
}

/**
 * @param {string | null | undefined} userId
 */
export function setAnalyticsUser(userId) {
  primaryProvider = userId ? createSupabaseAnalyticsProvider(userId) : null;
}

export function clearAnalyticsUser() {
  primaryProvider = null;
}

/**
 * Fire-and-forget product event.
 * @param {string} eventName
 * @param {{ module?: string, step?: string, properties?: Record<string, unknown> }} [opts]
 */
export function trackProductEvent(eventName, opts = {}) {
  const payload = { ...opts };
  if (primaryProvider) {
    Promise.resolve(primaryProvider.track(eventName, payload)).catch(() => {});
  }
  for (const p of extraProviders) {
    Promise.resolve(p.track(eventName, payload)).catch(() => {});
  }
}
