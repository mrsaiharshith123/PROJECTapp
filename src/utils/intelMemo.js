/**
 * Lightweight memo cache for heavy intel computations (per session).
 */

const cache = new Map();
const MAX_ENTRIES = 48;

/**
 * @param {string} key
 * @param {() => T} compute
 * @returns {T}
 * @template T
 */
export function memoIntel(key, compute) {
  if (cache.has(key)) return cache.get(key);
  const value = compute();
  if (cache.size >= MAX_ENTRIES) {
    const first = cache.keys().next().value;
    cache.delete(first);
  }
  cache.set(key, value);
  return value;
}

export function clearIntelMemo() {
  cache.clear();
}

export function buildIntelCacheKey(parts) {
  return parts.filter(Boolean).join("|");
}
