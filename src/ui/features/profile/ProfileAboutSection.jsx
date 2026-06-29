import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getLocalAppVersion } from "../../../services/appUpdate.js";
import { PerovoLogo } from "../../brand/PerovoLogo.jsx";

/** Editorial About block — no legacy PNG wordmark. */
export default function ProfileAboutSection() {
  const { t } = useTranslation();
  const version = getLocalAppVersion();

  return (
    <>
      <div className="ed-you-section">
        <div className="ed-ins-kicker">{t("support.about")}</div>
        <p className="ed-ins-body" style={{ marginBottom: 12 }}>
          {t("support.aboutBody")}
        </p>
        <p className="ed-you-field-hint">{t("support.version", { version })}</p>
      </div>

      <div className="ed-you-section" style={{ borderBottom: "none", textAlign: "center", paddingTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <PerovoLogo size="lg" alt="" />
        </div>
        <div
          className="ed-title"
          style={{ fontSize: 28, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}
        >
          {t("brand.appName")}
        </div>
        <p className="ed-ins-body" style={{ color: "var(--ed-gold)", marginBottom: 4 }}>
          {t("brand.tagline")}
        </p>
        <p className="ed-you-field-hint">{t("brand.byTadsaya")}</p>
      </div>
    </>
  );
}
