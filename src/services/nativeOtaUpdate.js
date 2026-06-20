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
  } catch {
    /* web preview / plugin not synced yet */
  }
}

/**
 * @typedef {{ phase: string, percent?: number, bytesLoaded?: number, bytesTotal?: number }} OtaProgress
 * @typedef {{ version: string, bundleUrl?: string, bundleSize?: number }} OtaManifest
 * @param {OtaManifest} manifest
 * @param {(p: OtaProgress) => void} [onProgress]
 */
export async function applyNativeOtaUpdate(manifest, onProgress) {
  if (!manifest.bundleUrl) {
    throw new Error("bundle_missing");
  }

  const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
  const total = manifest.bundleSize || 0;

  const listener = await CapacitorUpdater.addListener("download", (event) => {
    const percent = Math.round(Number(event.percent) || 0);
    onProgress?.({
      phase: "downloading",
      percent,
      bytesLoaded: total ? Math.round((total * percent) / 100) : undefined,
      bytesTotal: total || undefined,
    });
  });

  try {
    onProgress?.({ phase: "downloading", percent: 0, bytesLoaded: 0, bytesTotal: total || undefined });
    const bundle = await CapacitorUpdater.download({
      url: manifest.bundleUrl,
      version: manifest.version,
    });
    onProgress?.({ phase: "restarting", percent: 100, bytesLoaded: total || undefined, bytesTotal: total || undefined });
    await CapacitorUpdater.set(bundle);
  } finally {
    await listener.remove();
  }
}
