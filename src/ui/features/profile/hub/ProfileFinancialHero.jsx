import { useState } from "react";
import { Link } from "react-router-dom";
import { getUserModeConfig } from "../../../../constants/userModes.js";
import { resolveUserMode, hasPowerFeatures, isSalariedFamily } from "../../../../constants/modeExperience.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../../hooks/useCommitIntel.js";
import { useNetWorthIntel } from "../../../../hooks/useNetWorthIntel.js";
import { useProfileScoreGuide } from "../../../../hooks/useProfileScoreGuide.js";
import { translatePressureLabel } from "../../../../i18n/engineLabels.js";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import ProfileAvatar from "../ProfileAvatar.jsx";
import { Caption, Eyebrow, Heading } from "../../../primitives/Text.jsx";
import { CtIcon } from "../../../icons/CtIcon.jsx";
import { PlansButton } from "../../../patterns/PlansButton.jsx";
import { NotificationBell } from "../../../patterns/NotificationBell.jsx";
import { NotificationPanel } from "../../NotificationPanel.jsx";
import { NetWorthHeroBody } from "../../netWorth/NetWorthHero.jsx";

/**
 * Unified financial life card — identity, net worth, and key status in one place.
 * @param {{
 *   settings: object,
 *   updateSettings: (p: object) => void,
 *   onOpenAccount?: () => void,
 *   onOpenSettings?: () => void,
 * }} props
 */
export default function ProfileFinancialHero({
  settings,
  updateSettings,
  onOpenAccount,
  onOpenSettings,
}) {
  const { t } = useTranslation();
  const intel = useNetWorthIntel();
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const { notificationUnread } = useCommitIntel();
  const { heroChips } = useProfileScoreGuide();
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
            className="ct-privacy-toggle"
            onClick={togglePrivacyMode}
            aria-label={privacyMode ? t("netWorth.privacy.show") : t("netWorth.privacy.hide")}
          >
            <CtIcon name={privacyMode ? "eye-slash" : "eye"} size={18} />
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
        </div>
      </button>

      <div className="ct-profile-financial-hero-nw">
        <NetWorthHeroBody intel={intel} privacyMode={privacyMode} compact />
      </div>

      <div className="ct-profile-hero-chips-row">
        <div className="ct-profile-hero-chips ct-profile-hero-chips-status ct-profile-hero-chips-3">
          {heroChips.map((chip) => (
            <div key={chip.id} className={`ct-profile-chip ct-profile-chip-${chip.tone}`}>
              <Caption className="block ct-profile-chip-label">{t(chip.labelKey)}</Caption>
              {privacyMode ? (
                <span className="ct-profile-chip-value">•••</span>
              ) : chip.pressureLabel ? (
                <>
                  <span className="ct-profile-chip-value">
                    {translatePressureLabel(t, chip.pressureLabel)}
                  </span>
                  {chip.detailValue != null ? (
                    <Caption className="block ct-profile-chip-sub opacity-75">
                      {chip.detailValue}/100
                    </Caption>
                  ) : null}
                </>
              ) : (
                <span className="ct-profile-chip-value">{chip.value}</span>
              )}
              {!privacyMode && chip.subKey ? (
                <Caption className="block ct-profile-chip-sub">{t(chip.subKey)}</Caption>
              ) : null}
            </div>
          ))}
        </div>
        <Link
          to="/profile/scores"
          className="ct-profile-chip-plus"
          aria-label={t("profileHub.scoresDetailLink")}
        >
          <CtIcon name="plus" size={20} />
        </Link>
      </div>

      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </section>
  );
}
