import { useEffect } from "react";
import { checkForAppUpdate } from "../services/appUpdate.js";
import {
  isApkDownloadedForVersion,
  wasApkPermissionRequested,
} from "../services/pendingApkInstall.js";
import { isNativeCapacitorShell } from "../utils/nativePermissions.js";

/**
 * Passthrough with cold-start APK install retry when user was granting
 * "Install unknown apps" permission in the previous session.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function StartupUpdateGate({ children }) {
  useEffect(() => {
    if (!isNativeCapacitorShell()) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const check = await checkForAppUpdate();
        if (cancelled) return;

        if (
          check?.remoteVersion &&
          wasApkPermissionRequested(check.remoteVersion) &&
          isApkDownloadedForVersion(check.remoteVersion)
        ) {
          const { openCachedApkInstall } = await import("../services/nativeApkUpdate.js");
          await openCachedApkInstall(check.remoteVersion).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return children;
}
