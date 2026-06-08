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
 * Unified financial life card — identity, net worth, and key status in one place.
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

  const emergencyPct = hub.emergency?.progressPercent;
  const emergencyTone =
    hub.emergency?.tier === "on_track" || hub.emergency?.tier === "almost" ? "ok" : "watch";
  const pressureTone = hub.pressureScore <= 40 ? "ok" : hub.pressureScore <= 70 ? "mid" : "risk";
  const billsTone = hub.overdueCount > 0 ? "risk" : hub.pendingCount > 0 ? "mid" : "ok";

  const statusChips = [
    {
      id: "emergency",
      label: t("profileHub.widget.emergency"),
      value: emergencyPct != null ? `${emergencyPct}%` : "—",
      tone: emergencyTone,
    },
    {
      id: "pressure",
      label: t("profileHub.widget.pressure"),
      value: `${hub.pressureScore ?? 0}`,
      tone: pressureTone,
    },
    {
      id: "bills",
      label: t("profileHub.widget.pending"),
      value: `${hub.pendingCount}`,
      sub: hub.overdueCount > 0 ? t("profileHub.widget.pressureOverdue") : null,
      tone: billsTone,
    },
  ];

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
        </div>
      </button>

      <div className="ct-profile-financial-hero-nw">
        <NetWorthHeroBody intel={intel} privacyMode={privacyMode} compact />
      </div>

      <div className="ct-profile-hero-chips ct-profile-hero-chips-status">
        {statusChips.map((chip) => (
          <div key={chip.id} className={`ct-profile-chip ct-profile-chip-${chip.tone}`}>
            <Caption className="block ct-profile-chip-label">{chip.label}</Caption>
            <span className="ct-profile-chip-value">{chip.value}</span>
            {chip.sub && <Caption className="block ct-profile-chip-sub">{chip.sub}</Caption>}
          </div>
        ))}
      </div>

      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </section>
  );
}
