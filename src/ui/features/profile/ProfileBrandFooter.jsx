import { Caption } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.5.0";

export default function ProfileBrandFooter() {
  const { t } = useTranslation();

  return (
    <div className="ct-profile-brand ct-stat-tile !bg-transparent !border-0 !shadow-none pt-8 pb-2">
      <div className="ed-title" style={{ textAlign: "center", fontSize: 22 }}>
        {t("brand.appName")}
      </div>
      <Caption className="block text-center mt-2 opacity-75">{t("brand.tagline")}</Caption>
      <Caption className="block text-center mt-3 text-[10px] opacity-60">
        {t("profileHub.footerVersion", { version: APP_VERSION })}
      </Caption>
    </div>
  );
}
