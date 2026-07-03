import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroupRow, SettingsGroupContent } from "./SettingsGroup.jsx";
import { useAppUpdateAction } from "../../../hooks/useAppUpdateAction.js";
import UpdateProgressModal from "../UpdateProgressModal.jsx";

/** In-app OTA / APK update — check, progress bar, installer retry. */
export default function ProfileUpdateAppRow() {
  const { t } = useTranslation();
  const { status, busy, runUpdate, progressOpen, progress, canRetry, retryInstall } =
    useAppUpdateAction();

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
      {canRetry ? (
        <div
          style={{
            padding: "12px 14px",
            background: "var(--ed-gold-soft)",
            border: "0.5px solid var(--ed-gold)",
            borderRadius: "var(--ed-r-md)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--ed-font)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ed-gold)",
              marginBottom: 6,
            }}
          >
            {t("support.updateAppRetryTitle")}
          </div>
          <div
            style={{
              fontFamily: "var(--ed-font-news)",
              fontSize: 12,
              fontStyle: "italic",
              color: "var(--ed-ink-faint)",
              marginBottom: 10,
            }}
          >
            {t("support.updateAppRetryBody")}
          </div>
          <button type="button" className="ed-btn ed-btn-primary ed-btn-block" onClick={retryInstall}>
            {t("support.updateAppRetryCta")}
          </button>
        </div>
      ) : null}
      <UpdateProgressModal open={progressOpen} progress={progress} />
    </div>
  );
}
