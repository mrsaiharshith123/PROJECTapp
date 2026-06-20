import { useCallback, useState } from "react";
import { useUpdateTestTranslation } from "../i18n/UpdateTestShellI18n.jsx";
import { applyAppUpdate, checkForAppUpdate } from "../services/appUpdate.js";

/** Update flow for the minimal update test shell. */
export function useUpdateTestShellAction() {
  const { t } = useUpdateTestTranslation();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(null);

  const runUpdate = useCallback(async () => {
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
          if (p.phase === "restarting") setStatus(t("support.updateAppRestarting"));
        },
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setStatus(code === "bundle_missing" ? t("support.updateAppBundleMissing") : t("support.updateAppError"));
      setProgressOpen(false);
      setBusy(false);
    }
  }, [t]);

  return { status, busy, runUpdate, progressOpen, progress };
}
