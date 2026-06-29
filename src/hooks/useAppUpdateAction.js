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

  const runUpdate = async () => {
    setBusy(true);
    setStatus(t("support.updateAppChecking"));
    setProgressOpen(false);
    setProgress(null);

    try {
      const result = await checkForAppUpdate();

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
      await applyAppUpdate({
        force: result.status === "unknown",
        onProgress: (p) => {
          setProgress(p);
          if (p.phase === "restarting") {
            setStatus(t("support.updateAppRestarting"));
          }
        },
      });
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
