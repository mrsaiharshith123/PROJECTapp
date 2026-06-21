import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";
import { Caption } from "../../index.js";
import { useAppUpdateAction } from "../../../hooks/useAppUpdateAction.js";
import UpdateProgressModal from "../UpdateProgressModal.jsx";

/** In-app OTA update — check, progress bar, restart (no browser / APK reinstall). */
export default function ProfileUpdateAppRow() {
  const { t } = useTranslation();
  const { status, busy, runUpdate, progressOpen, progress } = useAppUpdateAction();

  return (
    <div className="ct-stack-sm">
      <SettingsGroupRow
        icon="arrows-clockwise"
        iconColor="violet"
        label={t("settings.row.updateApp")}
        hint={t("support.updateAppHint")}
        onClick={runUpdate}
        disabled={busy}
      />
      {status ? (
        <SettingsGroupContent>
          <Caption className="block">{status}</Caption>
        </SettingsGroupContent>
      ) : null}
      <UpdateProgressModal open={progressOpen} progress={progress} />
    </div>
  );
}
