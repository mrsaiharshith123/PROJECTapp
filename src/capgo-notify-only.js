/**
 * Standalone Capgo handshake — no React, no dynamic imports (must load before main app).
 *
 * This is the only place that should ever record an OTA bundle as "applied" —
 * reaching notifyAppReady() means this exact bundle genuinely booted and
 * confirmed itself, which is the one point we can trust. Writing the record
 * anywhere earlier (e.g. right after calling CapacitorUpdater.set()) records
 * an attempt as a success before Capgo's readiness watchdog has had a chance
 * to roll back a bundle that never actually took — which previously caused
 * "update degrades after a while, then Update says up to date" even though
 * the app had silently reverted to the old bundle.
 */
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { saveAppliedOtaRecord } from "./services/appliedOtaMeta.js";

void (async () => {
  try {
    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.()) {
      await CapacitorUpdater.notifyAppReady();
      const current = await CapacitorUpdater.current().catch(() => null);
      const version = current?.bundle?.version ? String(current.bundle.version) : "";
      if (version && version !== "builtin" && version !== "0.0.0") {
        saveAppliedOtaRecord({ version });
      }
    }
  } catch (err) {
    console.error("[capgo] notifyAppReady failed", err);
  }
})();
