/**
 * Standalone Capgo handshake for the update-test shell.
 */
import { CapacitorUpdater } from "@capgo/capacitor-updater";

void (async () => {
  try {
    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.()) {
      await CapacitorUpdater.notifyAppReady();
    }
  } catch (err) {
    console.error("[capgo] notifyAppReady failed", err);
  }
})();
