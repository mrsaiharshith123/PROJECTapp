const GOLD_API = "https://www.goldapi.io/api/XAU/INR";
const GOLD_KEY = import.meta.env.VITE_GOLD_API_KEY || "";

/** GoldAPI.io free tier — one request = one token. */
export const GOLD_API_MONTHLY_TOKEN_LIMIT = 100;

/** Refresh live rate at most 3×/day → ~90 tokens/month (under 100). */
export const GOLD_API_REFRESH_HOURS = 8;

export const GOLD_API_REFRESH_MS = GOLD_API_REFRESH_HOURS * 60 * 60 * 1000;

export function isGoldApiConfigured() {
  return Boolean(GOLD_KEY);
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
  if (!GOLD_KEY) return null;
  try {
    const res = await fetch(GOLD_API, {
      headers: { "x-access-token": GOLD_KEY, Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const perGram = data.price / 31.1035;
    return {
      perGram: Math.round(perGram),
      per10g: Math.round(perGram * 10),
      date: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
