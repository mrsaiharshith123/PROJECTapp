import { useState } from "react";
import { useTranslation } from "../i18n/I18nProvider.js";
import { applyAppUpdate, checkForAppUpdate } from "../services/appUpdate.js";

/** Shared update flow — check status, in-app download with progress, auto restart. */
export function useAppUpdateAction() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [canRetry, setCanRetry] = useState(false);

  const retryInstall = async () => {
    setCanRetry(false);
    setBusy(true);
    setStatus(t("support.updateAppApkInstalling"));
    try {
      const check = await checkForAppUpdate();
      if (check.status === "apk_ready" && check.remoteVersion) {
        const { openCachedApkInstall } = await import("../services/nativeApkUpdate.js");
        await openCachedApkInstall(check.remoteVersion);
        setStatus(t("support.updateAppApkInstall"));
        setCanRetry(true);
      }
    } catch {
      setStatus(t("support.updateAppError"));
      setCanRetry(true);
    } finally {
      setBusy(false);
    }
  };

  const runUpdate = async () => {
    setBusy(true);
    setStatus(t("support.updateAppChecking"));
    setProgressOpen(false);
    setProgress(null);

    try {
      const result = await checkForAppUpdate();

      if (result.status === "apk_ready" || result.status === "apk_pending") {
        setProgressOpen(true);
        setStatus(t("support.updateAppApkInstall"));
        const applyResult = await applyAppUpdate({
          allowApk: true,
          onProgress: (p) => {
            setProgress(p);
            if (p.phase === "installing") {
              setStatus(t("support.updateAppApkInstalling"));
            }
          },
        });
        if (applyResult?.status === "apk_install") {
          setProgressOpen(false);
          setBusy(false);
          setStatus(t("support.updateAppApkInstall"));
          setCanRetry(true);
        } else {
          setProgressOpen(false);
          setBusy(false);
        }
        return;
      }

      if (result.status === "current") {
        setStatus(t("support.updateAppCurrent", { version: result.localVersion }));
        setBusy(false);
        return;
      }

      if (result.status === "available" && result.remoteVersion) {
        const kind =
          result.updateKind === "apk"
            ? t("support.updateAppAvailableApk", {
                local: result.localNativeVersion || result.localVersion,
                remote: result.remoteVersion,
              })
            : t("support.updateAppAvailable", {
                local: result.localVersion,
                remote: result.remoteVersion,
              });
        setStatus(kind);
      }

      setProgressOpen(true);
      const applyResult = await applyAppUpdate({
        allowApk: true,
        onProgress: (p) => {
          setProgress(p);
          if (p.phase === "installing") {
            setStatus(t("support.updateAppApkInstalling"));
          } else if (p.phase === "restarting") {
            setStatus(t("support.updateAppRestarting"));
          }
        },
      });

      if (applyResult?.status === "apk_install") {
        setProgressOpen(false);
        setBusy(false);
        setStatus(t("support.updateAppApkInstall"));
        setCanRetry(true);
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
      } else if (code === "ota_download_failed" || code === "apk_download_failed" || code === "apk_encode_failed" || code === "apk_missing") {
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

  return { status, busy, runUpdate, progressOpen, progress, canRetry, retryInstall };
}
