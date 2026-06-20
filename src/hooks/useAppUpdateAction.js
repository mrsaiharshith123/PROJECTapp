import { useState } from "react";
import { useTranslation } from "../i18n/I18nProvider.js";
import { applyAppUpdate, checkForAppUpdate } from "../services/appUpdate.js";

const PHASE_KEYS = {
  checking: "support.updateAppChecking",
  downloading: "support.updateAppDownloading",
  restarting: "support.updateAppRestarting",
};

/** Shared update flow for Profile settings and the update test shell. */
export function useAppUpdateAction() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const runUpdate = async () => {
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
  };

  return { status, busy, runUpdate };
}
