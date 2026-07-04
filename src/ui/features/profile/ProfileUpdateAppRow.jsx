import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SettingsGroupRow } from "./SettingsGroup.jsx";
import { useAppUpdateAction } from "../../../hooks/useAppUpdateAction.js";
import UpdateProgressModal from "../UpdateProgressModal.jsx";

export default function ProfileUpdateAppRow() {
  const { t } = useTranslation();
  const { phase, progress, checkResult, check, installApk } = useAppUpdateAction();

  const busy = phase === "checking" || phase === "downloading";
  const showProgress = phase === "downloading";

  function statusLabel() {
    if (phase === "current") return t("support.updateAppCurrent", { version: checkResult?.localVersion || "" });
    if (phase === "apk_ready") {
      return t("support.updateAppShellOnly", {
        local: checkResult?.localNativeVersion || checkResult?.localVersion || "",
        remote: checkResult?.remoteVersion || "",
      });
    }
    if (phase === "error") return t("support.updateAppError");
    return "";
  }

  return (
    <div>
      <SettingsGroupRow
        icon="arrows-clockwise"
        iconColor="violet"
        label={t("settings.row.updateApp")}
        hint={t("support.updateAppHint")}
        onClick={phase === "apk_ready" ? installApk : check}
        disabled={busy}
      />

      {statusLabel() ? (
        <p
          style={{
            fontSize: 12,
            color: "var(--ed-muted, var(--color-muted))",
            padding: "4px 20px 8px",
          }}
        >
          {statusLabel()}
        </p>
      ) : null}

      {phase === "apk_ready" && checkResult?.remoteVersion ? (
        <div style={{ padding: "0 20px 12px" }}>
          <button
            type="button"
            className="ed-btn ed-btn-primary"
            style={{ width: "100%" }}
            onClick={installApk}
          >
            {t("support.updateAppInstallApk", { version: checkResult.remoteVersion })}
          </button>
        </div>
      ) : null}

      <UpdateProgressModal open={showProgress} progress={progress} />
    </div>
  );
}
