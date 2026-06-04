export const DATA_CHANGED_EVENT = "committrack:data-changed";

/** Fired after local finance data is persisted (sync layer listens; engines stay local-first). */
export function emitLocalDataChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
  }
}
