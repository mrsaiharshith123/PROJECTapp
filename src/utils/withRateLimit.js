const _calls = new Map();

/**
 * Returns true when the action should be blocked (called too recently).
 * @param {string} key
 * @param {number} [limitMs=5000]
 */
export function isRateLimited(key, limitMs = 5000) {
  const last = _calls.get(key) || 0;
  const now = Date.now();
  if (now - last < limitMs) return true;
  _calls.set(key, now);
  return false;
}
