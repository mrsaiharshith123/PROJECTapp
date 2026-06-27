import { isNativeCapacitorShell } from "./nativePermissions.js";

export const DEV_PHONE_DEVICE_KEY = "perovo_dev_phone_device";
export const DEV_PHONE_CHANGE_EVENT = "perovo_dev_phone_change";

/** @typedef {{ id: string, label: string, width: number, height: number }} DevPhonePreset */

/** @type {DevPhonePreset[]} */
export const DEV_PHONE_PRESETS = [
  { id: "s23-fe", label: "Galaxy S23 FE", width: 412, height: 915 },
  { id: "pixel-8", label: "Pixel 8", width: 412, height: 915 },
  { id: "iphone-15", label: "iPhone 15", width: 393, height: 852 },
  { id: "iphone-14", label: "iPhone 14", width: 390, height: 844 },
  { id: "iphone-se", label: "iPhone SE", width: 375, height: 667 },
  { id: "compact", label: "Compact 360", width: 360, height: 780 },
  { id: "large", label: "Large 430", width: 430, height: 932 },
];

const DEFAULT_PRESET = DEV_PHONE_PRESETS[0];

export function isLocalhostDev() {
  if (import.meta.env.DEV !== true) return false;
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

/** Localhost browser dev only — not native APK / Capacitor. */
export function isDevPhoneFrameCapable() {
  return isLocalhostDev() && !isNativeCapacitorShell();
}

/** @returns {DevPhonePreset} */
export function getDevPhoneDevice() {
  if (!isDevPhoneFrameCapable()) return DEFAULT_PRESET;
  try {
    const raw = localStorage.getItem(DEV_PHONE_DEVICE_KEY);
    if (!raw) return DEFAULT_PRESET;
    const parsed = JSON.parse(raw);
    const preset = DEV_PHONE_PRESETS.find((p) => p.id === parsed?.id);
    if (preset) return preset;
    const w = Number(parsed?.width);
    const h = Number(parsed?.height);
    if (w >= 320 && w <= 520 && h >= 568 && h <= 1200) {
      return {
        id: "custom",
        label: `${w} × ${h}`,
        width: Math.round(w),
        height: Math.round(h),
      };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PRESET;
}

/** @param {DevPhonePreset | { id?: string, width: number, height: number, label?: string }} device */
export function setDevPhoneDevice(device) {
  if (!isDevPhoneFrameCapable()) return;
  try {
    localStorage.setItem(DEV_PHONE_DEVICE_KEY, JSON.stringify(device));
  } catch {
    /* ignore */
  }
  applyDevPhoneFrameBootAttrs();
  window.dispatchEvent(new Event(DEV_PHONE_CHANGE_EVENT));
}

/** Apply html attrs before React paints — forces mobile shell on laptop dev. */
export function applyDevPhoneFrameBootAttrs() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!isDevPhoneFrameCapable()) {
    delete root.dataset.devPhoneFrame;
    root.style.removeProperty("--dev-phone-w");
    root.style.removeProperty("--dev-phone-h");
    root.style.removeProperty("--dev-phone-scale");
    return;
  }
  const device = getDevPhoneDevice();
  root.dataset.devPhoneFrame = "1";
  root.style.setProperty("--dev-phone-w", `${device.width}px`);
  root.style.setProperty("--dev-phone-h", `${device.height}px`);
}

/** Clear legacy toggle from older dev builds. */
export function clearLegacyDevPhoneFrameToggle() {
  if (!isDevPhoneFrameCapable()) return;
  try {
    localStorage.removeItem("perovo_dev_phone_frame");
  } catch {
    /* ignore */
  }
}

clearLegacyDevPhoneFrameToggle();
