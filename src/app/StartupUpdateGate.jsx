/**
 * Passthrough — updates are manual only (Settings → Update app).
 * Auto OTA/APK on cold start was removed; cloud backup stays in CloudSyncBridge.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function StartupUpdateGate({ children }) {
  return children;
}
