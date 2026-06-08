import { useState } from "react";
import { getUserModeConfig } from "../../../../constants/userModes.js";
import { resolveUserMode, hasPowerFeatures, isSalariedFamily } from "../../../../constants/modeExperience.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../../hooks/useCommitIntel.js";
import { useNetWorthIntel } from "../../../../hooks/useNetWorthIntel.js";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import ProfileAvatar from "../ProfileAvatar.jsx";
import { Caption, Eyebrow, Heading } from "../../../primitives/Text.jsx";
import { CtIcon } from "../../../icons/CtIcon.jsx";
import { PlansButton } from "../../../patterns/PlansButton.jsx";
import { NotificationBell } from "../../../patterns/NotificationBell.jsx";
import { NotificationPanel } from "../../NotificationPanel.jsx";
import { NetWorthHeroBody } from "../../netWorth/NetWorthHero.jsx";

/**
 * @param {{
 *   settings: object,
 *   updateSettings: (p: object) => void,
 *   hub: ReturnType<import('../../../../hooks/useProfileHubIntel.js').useProfileHubIntel>,
 *   onOpenAccount?: () => void,
 *   onOpenSettings?: () => void,
 * }} props
 */
export default function ProfileFinancialHero({
  settings,
  updateSettings,
  hub,
  onOpenAccount,
  onOpenSettings,
}) {
  const { t } = useTranslation();
  const intel = useNetWorthIntel();
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);
  const modeCfg = getUserModeConfig(resolveUserMode(settings));
  const salariedFamily = isSalariedFamily(settings);
  const name = settings.displayName?.trim() || t("brand.defaultUser");

  const suffix = [
    salariedFamily ? t("brand.familySuffix") : null,
    hasPowerFeatures(settings) ? t("brand.proSuffix") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="ct-nw-hero ct-profile-financial-hero ct-reveal">
      <div className="ct-nw-hero-glow" aria-hidden />
      <div className="ct-profile-hero-top">
        <Eyebrow>{t("netWorth.pageTitle")}</Eyebrow>
        <div className="ct-row gap-1.5 shrink-0">
          <button
            type="button"
            className="ct-notif-bell"
            onClick={togglePrivacyMode}
            aria-label={privacyMode ? t("netWorth.privacy.show") : t("netWorth.privacy.hide")}
          >
            <CtIcon name="lock" size={18} />
          </button>
          <PlansButton />
          <NotificationBell unread={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />
          <button
            type="button"
            className="ct-notif-bell"
            onClick={onOpenSettings}
            aria-label={t("profileHub.openSettings")}
          >
            <CtIcon name="gear" size={20} />
          </button>
        </div>
      </div>

      <button type="button" className="ct-profile-hero-identity" onClick={onOpenAccount}>
        <ProfileAvatar settings={settings} updateSettings={updateSettings} size="lg" compact />
        <div className="ct-profile-hero-text">
          <Heading level={2} className="!text-xl truncate">
            {name}
          </Heading>
          <Caption className="block truncate">
            <span className="inline-flex items-center gap-1">
              <CtIcon name={modeCfg.icon} size={14} />
              {t("mode.salaried")}
            </span>
            {suffix ? ` · ${suffix}` : ""}
          </Caption>
          <span
            className={`ct-profile-state ct-profile-state-${hub.stabilityScore >= 65 ? "ok" : hub.stabilityScore >= 45 ? "mid" : "risk"}`}
          >
            {hub.stabilityLabel}
          </span>
        </div>
      </button>

      <div className="ct-profile-financial-hero-nw">
        <NetWorthHeroBody intel={intel} privacyMode={privacyMode} />
      </div>

      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </section>
  );
}
