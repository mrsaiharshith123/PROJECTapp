import { invokeApiProxy, isApiProxyAvailable } from "../apiProxy.js";

/** GoldAPI.io free tier — one request = one token. */
export const GOLD_API_MONTHLY_TOKEN_LIMIT = 100;

/** Refresh live rate at most 3×/day → ~90 tokens/month (under 100). */
export const GOLD_API_REFRESH_HOURS = 8;

export const GOLD_API_REFRESH_MS = GOLD_API_REFRESH_HOURS * 60 * 60 * 1000;

export function isGoldApiConfigured() {
  return isApiProxyAvailable();
}

/**
 * @param {string | null | undefined} lastFetchedIso
 */
export function isGoldRateCacheStale(lastFetchedIso) {
  const last = lastFetchedIso ? new Date(lastFetchedIso).getTime() : 0;
  if (!last) return true;
  return Date.now() - last > GOLD_API_REFRESH_MS;
}

/**
 * Whether to spend an API token on a fresh fetch.
 * @param {string | null | undefined} lastFetchedIso
 * @param {number | null | undefined} cachedRatePerGram
 */
export function shouldRefreshGoldRate(lastFetchedIso, cachedRatePerGram) {
  const hasRate = cachedRatePerGram != null && Number(cachedRatePerGram) > 0;
  if (!hasRate) return true;
  return isGoldRateCacheStale(lastFetchedIso);
}

/**
 * Cached 24K INR/gram from settings — shared by all gold assets (no per-asset API calls).
 * @param {{ goldRatePerGram?: number | null }} settings
 */
export function getCachedGoldRatePerGram(settings) {
  const rate = Number(settings?.goldRatePerGram);
  return rate > 0 ? rate : null;
}

export async function fetchGoldPricePerGram() {
  if (!isGoldApiConfigured()) return null;
  const data = await invokeApiProxy({ service: "gold-price" });
  if (!data || data.error) return null;
  return {
    perGram: data.perGram,
    per10g: data.per10g,
    date: data.date,
  };
}
