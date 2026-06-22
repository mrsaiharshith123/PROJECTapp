import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import ProfilePersonalSection from "../ProfilePersonalSection.jsx";
import YouSubPageShell from "./YouSubPageShell.jsx";

export default function YouAppearancePage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  return (
    <YouSubPageShell titleKey="settings.row.appearance">
      <div className="ct-stat-tile violet mb-1">
        <p className="ct-stat-tile-label">{t("profile.language")}</p>
        <p className="ct-stat-tile-value text-xs mt-1">{t("profile.languageHint")}</p>
      </div>
      <ProfilePersonalSection settings={settings} updateSettings={updateSettings} part="appearance" />
    </YouSubPageShell>
  );
}
