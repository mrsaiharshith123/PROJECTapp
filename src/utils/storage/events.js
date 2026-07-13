export const DATA_CHANGED_EVENT = "perovo:data-changed";
export const SETTINGS_RESET_EVENT = "perovo:settings-reset";

/**
 * Both events below are a cross-provider event bus: PerovoProvider emits,
 * NetWorthProvider (and CloudSyncBridge, LocalReminderSync, ...) listen.
 * `window.dispatchEvent` runs every listener SYNCHRONOUSLY before returning —
 * if a listener calls setState while the emitting code is itself running
 * inside another component's effect, React's dev-mode instrumentation can
 * (correctly) flag it as one component updating another while it renders,
 * since the whole chain shares one call stack. Dispatching via queueMicrotask
 * decouples emit-time from listener-execution-time: listeners still run
 * "immediately after" in practical terms, just on a fresh microtask outside
 * whichever component's render/effect happened to trigger the emit.
 */
function dispatchDecoupled(eventName) {
  if (typeof window === "undefined") return;
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(eventName));
  });
}

/** Fired after local finance data is persisted (sync layer listens; engines stay local-first). */
export function emitLocalDataChanged() {
  dispatchDecoupled(DATA_CHANGED_EVENT);
}

/** Fired when auth cleared local account flags (server profile gone). */
export function emitSettingsReset() {
  dispatchDecoupled(SETTINGS_RESET_EVENT);
}
