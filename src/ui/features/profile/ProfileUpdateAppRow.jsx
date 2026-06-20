import { useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";
import { Caption } from "../../index.js";
import { applyAppUpdate, checkForAppUpdate } from "../../../services/appUpdate.js";

/** One-tap update row for Profile settings (not the About sub-panel). */
export default function ProfileUpdateAppRow() {
  const { t } = useTranslation();
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateBusy, setUpdateBusy] = useState(false);

  const handleUpdateApp = async () => {
    setUpdateBusy(true);
    setUpdateStatus(t("support.updateAppChecking"));
    try {
      const result = await checkForAppUpdate();
      if (result.status === "available") {
        setUpdateStatus(
          t("support.updateAppAvailable", {
            local: result.localVersion,
            remote: result.remoteVersion,
          }),
        );
      }
      setUpdateStatus(t("support.updateAppApplying"));
      await applyAppUpdate();
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
      {updateStatus && !updateBusy ? (
        <SettingsGroupContent>
          <Caption className="block">{updateStatus}</Caption>
        </SettingsGroupContent>
      ) : null}
    </>
  );
}
