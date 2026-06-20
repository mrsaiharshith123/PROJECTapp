const SENT_PREFIX = "perovo_browser_sent_";

/** Avoid re-firing the same browser alert many times per day. */
export function wasBrowserNotificationSent(id, todayStr) {
  try {
    const key = `${SENT_PREFIX}${todayStr}_${id}`;
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function markBrowserNotificationSent(id, todayStr) {
  try {
    const key = `${SENT_PREFIX}${todayStr}_${id}`;
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}
