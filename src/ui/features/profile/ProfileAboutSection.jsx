import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import { ADMIN_UI_ENABLED } from "../../../constants/featureFlags.js";
import { getLocalAppVersion } from "../../../services/appUpdate.js";
import { PerovoLogo } from "../../brand/PerovoLogo.jsx";

const ADMIN_VERSION_TAPS = 9;
const ADMIN_TAP_RESET_MS = 2000;

/** Editorial About block — no legacy PNG wordmark. */
export default function ProfileAboutSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const version = getLocalAppVersion();
  const adminTapCountRef = useRef(0);
  const adminTapTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);
    },
    [],
  );

  const handleVersionTap = useCallback(() => {
    if (!ADMIN_UI_ENABLED || !isAdmin) return;
    if (adminTapTimerRef.current) clearTimeout(adminTapTimerRef.current);
    adminTapCountRef.current += 1;
    if (adminTapCountRef.current >= ADMIN_VERSION_TAPS) {
      adminTapCountRef.current = 0;
      navigate("/admin");
      return;
    }
    adminTapTimerRef.current = setTimeout(() => {
      adminTapCountRef.current = 0;
    }, ADMIN_TAP_RESET_MS);
  }, [isAdmin, navigate]);

  const versionLabel = t("support.version", { version });
  const versionCanUnlock = ADMIN_UI_ENABLED && isAdmin;

  return (
    <>
      <div className="ed-you-section">
        <div className="ed-ins-kicker">{t("support.about")}</div>
        <p className="ed-ins-body" style={{ marginBottom: 12 }}>
          {t("support.aboutBody")}
        </p>
        {versionCanUnlock ? (
          <button type="button" className="ed-you-field-hint ed-about-version-tap" onClick={handleVersionTap}>
            {versionLabel}
          </button>
        ) : (
          <p className="ed-you-field-hint">{versionLabel}</p>
        )}
      </div>

      <div className="ed-you-section" style={{ borderBottom: "none", textAlign: "center", paddingTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <PerovoLogo size="lg" alt="" />
        </div>
        <p className="ed-you-field-hint">{t("brand.byTadsaya")}</p>
      </div>
    </>
  );
}
