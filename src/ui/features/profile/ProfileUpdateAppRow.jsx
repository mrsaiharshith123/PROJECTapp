import { useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";
import { Caption } from "../../index.js";
import { applyAppUpdate, checkForAppUpdate } from "../../../services/appUpdate.js";

const PHASE_KEYS = {
  checking: "support.updateAppChecking",
  downloading: "support.updateAppDownloading",
  restarting: "support.updateAppRestarting",
};

/** One-tap in-app update — checks live server, pulls build, restarts (no browser redirect). */
export default function ProfileUpdateAppRow() {
  const { t } = useTranslation();
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateBusy, setUpdateBusy] = useState(false);

  const handleUpdateApp = async () => {
    setUpdateBusy(true);
    setUpdateStatus(t("support.updateAppChecking"));
    try {
      const result = await checkForAppUpdate();
      if (result.status === "current") {
        setUpdateStatus(t("support.updateAppCurrent", { version: result.localVersion }));
        setUpdateBusy(false);
        return;
      }

      if (result.status === "available" && result.remoteVersion) {
        setUpdateStatus(
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
          if (key) setUpdateStatus(t(key));
        },
      });
    } catch {
      setUpdateStatus(t("support.updateAppError"));
      setUpdateBusy(false);
    }
  };

  return (
    <>
      <SettingsGroupRow
        icon="arrows-clockwise"
        iconColor="violet"
        label={t("settings.row.updateApp")}
        hint={t("support.updateAppHint")}
        onClick={handleUpdateApp}
        disabled={updateBusy}
      />
      {updateStatus ? (
        <SettingsGroupContent>
          <Caption className="block">{updateStatus}</Caption>
        </SettingsGroupContent>
      ) : null}
    </>
  );
}
