import { useCallback, useState } from "react";
import { useUpdateTestTranslation } from "../i18n/UpdateTestShellI18n.jsx";
import { applyAppUpdate, checkForAppUpdate } from "../services/appUpdate.js";

const PHASE_KEYS = {
  checking: "support.updateAppChecking",
  downloading: "support.updateAppDownloading",
  restarting: "support.updateAppRestarting",
};

/** Update flow for the minimal update test shell (English-only i18n). */
export function useUpdateTestShellAction() {
  const { t } = useUpdateTestTranslation();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const runUpdate = useCallback(async () => {
    setBusy(true);
    setStatus(t("support.updateAppChecking"));
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

      await applyAppUpdate({
        force: result.status === "unknown",
        onPhase: (phase) => {
          const key = PHASE_KEYS[phase];
          if (key) setStatus(t(key));
        },
      });
    } catch {
      setStatus(t("support.updateAppError"));
      setBusy(false);
    }
  }, [t]);

  return { status, busy, runUpdate };
}
