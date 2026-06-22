import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { Button } from "../primitives/Button.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";

export function InstallAppBanner() {
  const { t } = useTranslation();
  const { canInstall, showIosHint, showAndroidHint, showInstallUi, install, dismiss } = usePwaInstall();

  if (!showInstallUi) return null;

  let hint = t("install.hintDefault");
  if (canInstall) hint = t("install.hintCanInstall");
  else if (showIosHint) hint = t("install.hintIos");
  else if (showAndroidHint) hint = t("install.hintAndroid");

  return (
    <div className="ct-stat-tile teal ct-install-banner">
      <div className="ct-row gap-3 items-start min-w-0 flex-1">
        <span className="ct-icon-tile ct-icon-tile-sm teal shrink-0" aria-hidden>
          <CtIcon name="device-mobile" size={18} weight="duotone" />
        </span>
        <div className="min-w-0">
          <p className="ct-stat-tile-label !text-sm !font-semibold !text-[var(--ct-text)]">{t("install.title")}</p>
          <p className="ct-promo-body">{hint}</p>
        </div>
      </div>
      <div className="ct-row shrink-0">
        {canInstall && (
          <Button type="button" size="sm" onClick={() => install()}>
            {t("install.installApp")}
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={dismiss}>
          {t("install.dismiss")}
        </Button>
      </div>
    </div>
  );
}

export default InstallAppBanner;
