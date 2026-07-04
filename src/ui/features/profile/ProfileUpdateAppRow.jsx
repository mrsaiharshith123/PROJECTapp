import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";
import { useAppUpdateAction } from "../../../hooks/useAppUpdateAction.js";
import UpdateProgressModal from "../UpdateProgressModal.jsx";

/** In-app OTA update — manual check, progress bar, auto restart. */
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
          <div className="ct-stat-tile indigo">
            <p className="ct-stat-tile-value text-sm">{status}</p>
          </div>
        </SettingsGroupContent>
      ) : null}
      <UpdateProgressModal open={progressOpen} progress={progress} />
    </div>
  );
}
