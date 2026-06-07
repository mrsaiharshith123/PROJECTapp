import { Caption } from "../../primitives/Text.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";

export default function ProfileBrandFooter() {
  const { t } = useTranslation();
  return (
    <div className="ct-profile-brand">
      <Caption className="block text-center font-semibold text-[var(--ct-text-secondary)]">
        {t("brand.appName")} {t("brand.byDaloyTech")}
      </Caption>
      <Caption className="block text-center mt-0.5 opacity-70">{t("brand.tadsayaNote")}</Caption>
    </div>
  );
}
