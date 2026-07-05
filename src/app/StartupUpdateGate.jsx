import { useEffect } from "react";
import { syncApkUpdateTrackingWithInstalled } from "../services/pendingApkInstall.js";
import { fetchRemoteManifest } from "../services/appUpdate.js";
import { cleanupUpdateStorageOnBoot } from "../services/updateStorageCleanup.js";

/**
 * On cold boot: sync APK tracking state so stale apk_ready is cleared
 * if the user already installed the APK outside the app.
 * Prune stale update downloads so Android "cache" does not balloon.
 * No UI — silent background task only.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function StartupUpdateGate({ children }) {
  useEffect(() => {
    fetchRemoteManifest()
      .then((remote) => {
        if (remote?.version) syncApkUpdateTrackingWithInstalled(remote);
      })
      .catch(() => {});

    cleanupUpdateStorageOnBoot().catch(() => {});
  }, []);

  return children;
}
