import { CtIcon } from "../icons/CtIcon.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";

export function OfflineScreen() {
  const { t } = useTranslation();

  return (
    <div className="ed-offline-screen" role="status" aria-live="polite">
      <div className="ed-offline-icon" aria-hidden>
        📡
      </div>
      <h1 className="ed-offline-title">{t("offline.title")}</h1>
      <p className="ed-offline-body">{t("offline.body")}</p>
      <p className="ed-offline-hint">
        <CtIcon name="wifi-off" size={14} />
        {t("offline.hint")}
      </p>
    </div>
  );
}
