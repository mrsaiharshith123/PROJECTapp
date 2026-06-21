import { Caption } from "../../index.js";
import { PerovoBrand } from "../../brand/PerovoBrand.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

export default function ProfileBrandFooter() {
  const { t } = useTranslation();

  return (
    <div className="ct-profile-brand">
      <PerovoBrand layout="column" iconSize="md" wordmarkSize="sm" className="ct-profile-brand-lockup" />
      <Caption className="block text-center mt-2 opacity-75">{t("brand.tagline")}</Caption>
      <Caption className="block text-center mt-2 opacity-60">
        {t("profileHub.footerVersion", { version: APP_VERSION })}
      </Caption>
    </div>
  );
}
