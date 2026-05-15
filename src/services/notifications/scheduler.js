const LAST_DIGEST_KEY = "committrack_last_notif_digest";

/** Once per calendar day per device. */
export function shouldRunDailyDigest(todayStr) {
  try {
    const last = localStorage.getItem(LAST_DIGEST_KEY);
    if (last === todayStr) return false;
    return true;
  } catch {
    return true;
  }
}

export function markDailyDigestRan(todayStr) {
  try {
    localStorage.setItem(LAST_DIGEST_KEY, todayStr);
  } catch {
    /* ignore */
  }
}

/** Pick highest-priority unread items for browser notifications. */
export function pickDigestNotifications(feed, limit = 3) {
  const unread = (feed || []).filter((n) => !n.read);
  const order = { critical: 0, high: 1, normal: 2, low: 3 };
  return [...unread]
    .sort((a, b) => (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9))
    .slice(0, limit);
}
