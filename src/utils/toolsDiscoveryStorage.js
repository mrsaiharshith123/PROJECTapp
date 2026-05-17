const STORAGE_KEY = "committrack_tools_nudge_dismissed";

export function isToolsNudgeDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissToolsNudge() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}
