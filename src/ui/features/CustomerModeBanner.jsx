import { useTranslation } from "../../i18n/I18nProvider.js";
import { isEmbeddedApp, isCustomerModeEnabled } from "../../utils/embeddedApp.js";
import { Caption } from "../index.js";

/** Shown on production web when customer mode is off (?app=1) — quick switch back to landing. */
export default function CustomerModeBanner() {
  const { t } = useTranslation();

  if (import.meta.env.DEV || isEmbeddedApp() || isCustomerModeEnabled()) return null;

  return (
    <div className="ct-customer-mode-banner" role="status">
      <Caption>{t("webLanding.devBanner")}</Caption>
      <a href="?app=0" className="ct-landing-link">
        {t("webLanding.devBannerBack")}
      </a>
    </div>
  );
}
