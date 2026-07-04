import { useState } from "react";
import { useTranslation } from "../i18n/I18nProvider.js";
import { applyAppUpdate, checkForAppUpdate } from "../services/appUpdate.js";

/** @param {import("../services/appUpdate.js").UpdateCheckResult} result */
function isShellOnlyUpdate(result) {
  return (
    result.status === "apk_ready" ||
    result.status === "apk_pending" ||
    (result.status === "available" && result.needsApk && !result.needsOta)
  );
}

/** Shared update flow — manual check, OTA bundle only (no APK installer). */
export function useAppUpdateAction() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(null);

  const runUpdate = async () => {
    setBusy(true);
    setStatus(t("support.updateAppChecking"));
    setProgressOpen(false);
    setProgress(null);

    try {
      const result = await checkForAppUpdate();

      if (isShellOnlyUpdate(result)) {
        setStatus(
          t("support.updateAppShellOnly", {
            local: result.localNativeVersion || result.localVersion,
            remote: result.remoteVersion || "",
          }),
        );
        setBusy(false);
        return;
      }

      if (result.status === "current") {
        setStatus(t("support.updateAppCurrent", { version: result.localVersion }));
        setBusy(false);
        return;
      }

      if (result.status === "available" && result.remoteVersion) {
        setStatus(
          t("support.updateAppAvailable", {
            local: result.localVersion,
            remote: result.remoteVersion,
          }),
        );
      }

      setProgressOpen(true);
      const applyResult = await applyAppUpdate({
        allowApk: false,
        onProgress: (p) => {
          setProgress(p);
          if (p.phase === "restarting") {
            setStatus(t("support.updateAppRestarting"));
          }
        },
      });

      if (applyResult?.status === "apk_deferred") {
        setProgressOpen(false);
        setBusy(false);
        setStatus(
          t("support.updateAppShellOnly", {
            local: result.localNativeVersion || result.localVersion,
            remote: result.remoteVersion || "",
          }),
        );
        return;
      }

      window.setTimeout(() => {
        setProgressOpen(false);
        setBusy(false);
        setStatus(t("support.updateAppApplyFailed"));
      }, 4000);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "bundle_missing") {
        setStatus(t("support.updateAppBundleMissing"));
      } else if (code === "ota_download_failed") {
        setStatus(t("support.updateAppDownloadFailed"));
      } else if (code === "ota_apply_failed" || code === "ota_apply_timeout" || code === "ota_bundle_id_missing") {
        setStatus(t("support.updateAppApplyFailed"));
      } else {
        setStatus(t("support.updateAppError"));
      }
      setProgressOpen(false);
      setBusy(false);
    }
  };

  return { status, busy, runUpdate, progressOpen, progress };
}
