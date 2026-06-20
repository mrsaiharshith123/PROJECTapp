import { useTranslation } from "../../i18n/I18nProvider.js";
import { useDocumentTheme } from "../../hooks/useDocumentTheme.js";
import { assetUrl } from "../../utils/basePath.js";
import { brandIconForTheme, brandWordmarkForTheme } from "./brandAssets.js";
import { cn } from "../utils/cn.js";

/** Landing hero lockup — canonical icon + wordmark only. */
export function LandingBrandLockup({ className = "" }) {
  const { t } = useTranslation();
  const theme = useDocumentTheme();
  const iconFile = brandIconForTheme(theme);
  const wordmarkFile = brandWordmarkForTheme(theme);

  return (
    <div className={cn("ct-landing-lockup", className)} role="img" aria-label={t("brand.appName")}>
      <img
        src={assetUrl(`brand/${iconFile}`)}
        alt=""
        width={80}
        height={80}
        className="ct-landing-app-icon"
        draggable={false}
      />
      <img
        src={assetUrl(`brand/${wordmarkFile}`)}
        alt=""
        height={52}
        className="ct-perovo-wordmark ct-perovo-wordmark-lg"
        draggable={false}
      />
    </div>
  );
}
