const STORAGE_KEY = "committrack_tools_nudge_dismissed";
const SESSION_KEY = "committrack_tools_nudge_session";
/** Re-show nudge after this many days if user dismissed it. */
const DISMISS_TTL_DAYS = 7;

export function isToolsNudgeDismissed() {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") return true;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    // Legacy permanent flag — treat as expired so the nudge can show again.
    if (raw === "1") {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    const ts = Number(raw);
    if (!Number.isFinite(ts)) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }

    const ageMs = Date.now() - ts;
    if (ageMs > DISMISS_TTL_DAYS * 86400000) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function dismissToolsNudge() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
