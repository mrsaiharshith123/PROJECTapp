/**
 * Returns v if it is a finite number, otherwise returns fallback.
 * Use at every engine output boundary.
 */
export function safeNum(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
}

/** Clamp + safeNum — for 0-100 scores */
export function safeScore(v) {
  const n = Number.isFinite(v) ? v : 0;
  return Math.min(100, Math.max(0, n));
}

/** Array of numbers → sum, never NaN */
export function safeSum(arr) {
  return (arr || []).reduce((s, v) => s + safeNum(v), 0);
}
