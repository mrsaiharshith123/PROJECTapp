/**
 * Standalone Capgo handshake — no React, no dynamic imports (must load before main app).
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
