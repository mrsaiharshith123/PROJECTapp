export const DATA_CHANGED_EVENT = "committrack:data-changed";
export const SETTINGS_RESET_EVENT = "committrack:settings-reset";

/** Fired after local finance data is persisted (sync layer listens; engines stay local-first). */
export function emitLocalDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  }
}

/** Fired when auth cleared local account flags (server profile gone). */
export function emitSettingsReset() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_RESET_EVENT));
  }
}
