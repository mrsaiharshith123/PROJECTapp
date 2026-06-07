import { getUserModeConfig } from "../../constants/userModes.js";
import { resolveUserMode, hasPowerFeatures, isSalariedFamily } from "../../constants/modeExperience.js";
import ProfileAvatar from "./profile/ProfileAvatar.jsx";
import { Caption } from "../primitives/Text.jsx";
import { useTranslation } from "../../i18n/I18nProvider.jsx";

/**
 * @param {{ settings: object, updateSettings: (p: object) => void }} props
 */
export function ProfileCompactHeader({ settings, updateSettings }) {
  const { t } = useTranslation();
  const modeCfg = getUserModeConfig(resolveUserMode(settings));
  const salariedFamily = isSalariedFamily(settings);

  const suffix = [
    salariedFamily ? t("brand.familySuffix") : null,
    hasPowerFeatures(settings) ? t("brand.proSuffix") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="ct-profile-compact">
      <ProfileAvatar settings={settings} updateSettings={updateSettings} size="sm" compact />
      <div className="min-w-0 flex-1">
        <p className="ct-body-strong truncate">{settings.displayName?.trim() || t("brand.defaultUser")}</p>
        <Caption className="block truncate">
          {modeCfg.emoji} {t("mode.salaried")}
          {suffix ? ` · ${suffix}` : ""}
        </Caption>
        <Caption className="block truncate opacity-70 mt-0.5">
          {t("brand.appName")} {t("brand.byDaloyTech")}
        </Caption>
      </div>
    </div>
  );
}

export default ProfileCompactHeader;
