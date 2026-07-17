import { isEmbeddedApp } from "../utils/embeddedApp.js";

/** Native Capacitor shell with the OTA plugin available. */
export function canUseNativeOta() {
  if (!isEmbeddedApp()) return false;
  if (typeof window === "undefined") return false;
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

/** Tell Capgo the current bundle loaded — prevents rollback after OTA. */
export async function notifyNativeAppReady() {
  if (!canUseNativeOta()) return;
  try {
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    await CapacitorUpdater.notifyAppReady();
  } catch (err) {
    console.warn("notifyAppReady failed", err);
  }
}

/** @returns {Promise<{ status?: string, version?: string, id?: string } | null>} */
export async function getNativeBundleInfo() {
  if (!canUseNativeOta()) return null;
  try {
    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    const current = await CapacitorUpdater.current();
    return current?.bundle ?? null;
  } catch {
    return null;
  }
}

/** Roll back to the built-in APK bundle (recovery from failed OTA). */
export async function resetNativeOtaBundle() {
  if (!canUseNativeOta()) return;
  const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
  await CapacitorUpdater.reset();
}

const APPLY_RELOAD_TIMEOUT_MS = 45000;

/**
 * @typedef {{ phase: string, percent?: number, bytesLoaded?: number, bytesTotal?: number }} OtaProgress
 * @typedef {{ version: string, builtAt?: string, bundleUrl?: string, bundleSize?: number }} OtaManifest
 * @param {OtaManifest} manifest
 * @param {(p: OtaProgress) => void} [onProgress]
 */
export async function applyNativeOtaUpdate(manifest, onProgress) {
  if (!manifest.bundleUrl) {
    throw new Error("bundle_missing");
  }

  const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
  const total = manifest.bundleSize || 0;
  /** @type {{ remove: () => Promise<void> }[]} */
  const listeners = [];

  const track = async (eventName, handler) => {
    const handle = await CapacitorUpdater.addListener(eventName, handler);
    listeners.push(handle);
  };

  let failReason = "";
  const fail = (code) => {
    failReason = code;
  };

  try {
    await track("download", (event) => {
      const percent = Math.round(Number(event.percent) || 0);
      onProgress?.({
        phase: "downloading",
        percent,
        bytesLoaded: total ? Math.round((total * percent) / 100) : undefined,
        bytesTotal: total || undefined,
      });
    });
    await track("downloadFailed", () => fail("ota_download_failed"));
    await track("updateFailed", () => fail("ota_apply_failed"));

    onProgress?.({ phase: "downloading", percent: 0, bytesLoaded: 0, bytesTotal: total || undefined });
    const bundle = await CapacitorUpdater.download({
      url: manifest.bundleUrl,
      version: manifest.version,
    });

    if (failReason) throw new Error(failReason);

    const bundleId = bundle?.id;
    if (!bundleId) throw new Error("ota_bundle_id_missing");

    onProgress?.({
      phase: "restarting",
      percent: 100,
      bytesLoaded: total || undefined,
      bytesTotal: total || undefined,
    });

    // Manual Capgo flow: set() applies the bundle and reloads immediately.
    // next()+reload() often hangs at 100% on Android WebViews.
    // We deliberately do NOT record this bundle as "applied" here — set()/next()
    // can appear to succeed while the bundle never actually becomes the one that
    // boots (Capgo's own readiness watchdog can still roll it back). The applied
    // record is only written from src/capgo-notify-only.js, after the new bundle
    // has actually booted and confirmed itself ready — that's the only point we
    // truly know which version is running, not just which one we asked for.
    try {
      await Promise.race([
        CapacitorUpdater.set({ id: bundleId }),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error("ota_apply_timeout")), APPLY_RELOAD_TIMEOUT_MS);
        }),
      ]);
    } catch {
      await CapacitorUpdater.next({ id: bundleId }).catch(() => {});
      void CapacitorUpdater.reload().catch(() => {});
      window.setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  } finally {
    await Promise.all(listeners.map((handle) => handle.remove().catch(() => {})));
  }
}
