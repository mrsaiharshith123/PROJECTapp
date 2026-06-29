import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";

export default function ProfileSupportSection({ onOpenGuide }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="ed-you-section" style={{ borderBottom: "none" }}>
      <div className="ed-ins-kicker">{t("support.title")}</div>
      <p className="ed-ins-body" style={{ marginBottom: 12 }}>
        {t("support.subtitle")}
      </p>
      <div className="ed-you-action-row" onClick={onOpenGuide} role="button" tabIndex={0}>
        <div>
          <div className="ed-you-action-title">{t("support.helpCenter")}</div>
          <div className="ed-you-action-desc">{t("support.helpCenterHint")}</div>
        </div>
        <span className="ed-you-action-arrow">→</span>
      </div>
      <div
        className="ed-you-action-row"
        onClick={() => navigate("/privacy")}
        role="button"
        tabIndex={0}
      >
        <div>
          <div className="ed-you-action-title">{t("support.privacy")}</div>
          <div className="ed-you-action-desc">{t("support.privacyHint")}</div>
        </div>
        <span className="ed-you-action-arrow">→</span>
      </div>
      <div
        className="ed-you-action-row"
        onClick={() => {
          window.location.href = `mailto:${t("support.contactEmail")}`;
        }}
        role="button"
        tabIndex={0}
      >
        <div>
          <div className="ed-you-action-title">{t("support.contact")}</div>
          <div className="ed-you-action-desc">{t("support.contactEmail")}</div>
        </div>
        <span className="ed-you-action-arrow">→</span>
      </div>
    </div>
  );
}
