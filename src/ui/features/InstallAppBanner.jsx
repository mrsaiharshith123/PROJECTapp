import { usePwaInstall } from "../../hooks/usePwaInstall.js";
import { useTranslation } from "../../i18n/I18nProvider.jsx";
import { Button } from "../primitives/Button.jsx";
import { Row } from "../primitives/Stack.jsx";

export function InstallAppBanner() {
  const { t } = useTranslation();
  const { canInstall, showIosHint, showAndroidHint, showInstallUi, install, dismiss } = usePwaInstall();

  if (!showInstallUi) return null;

  let hint = t("install.hintDefault");
  if (canInstall) hint = t("install.hintCanInstall");
  else if (showIosHint) hint = t("install.hintIos");
  else if (showAndroidHint) hint = t("install.hintAndroid");

  return (
    <div className="ct-promo">
      <Row between className="flex-wrap gap-3 items-start">
        <div className="min-w-0 flex-1">
          <p className="ct-promo-title">{t("install.title")}</p>
          <p className="ct-promo-body">{hint}</p>
        </div>
        <Row className="shrink-0">
          {canInstall && (
            <Button type="button" size="sm" onClick={() => install()}>
              {t("install.installApp")}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={dismiss}>
            {t("install.dismiss")}
          </Button>
        </Row>
      </Row>
    </div>
  );
}

export default InstallAppBanner;
