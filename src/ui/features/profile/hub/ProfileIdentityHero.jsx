import { useState } from "react";
import { getUserModeConfig } from "../../../../constants/userModes.js";
import { resolveUserMode, hasPowerFeatures, isSalariedFamily } from "../../../../constants/modeExperience.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../../hooks/useCommitIntel.js";
import ProfileAvatar from "../ProfileAvatar.jsx";
import { Caption, Eyebrow, Heading } from "../../../primitives/Text.jsx";
import { CtIcon } from "../../../icons/CtIcon.jsx";
import { PlansButton } from "../../../patterns/PlansButton.jsx";
import { NotificationBell } from "../../../patterns/NotificationBell.jsx";
import { NotificationPanel } from "../../NotificationPanel.jsx";

/**
 * @param {{
 *   settings: object,
 *   updateSettings: (p: object) => void,
 *   hub: ReturnType<import('../../../../hooks/useProfileHubIntel.js').useProfileHubIntel>,
 *   onOpenAccount?: () => void,
 * }} props
 */
export default function ProfileIdentityHero({ settings, updateSettings, hub, onOpenAccount }) {
  const { t } = useTranslation();
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);
  const modeCfg = getUserModeConfig(resolveUserMode(settings));
  const salariedFamily = isSalariedFamily(settings);
  const name = settings.displayName?.trim() || t("brand.defaultUser");

  const chips = [
    { id: "stability", label: t("profileHub.chip.stability"), value: `${hub.stabilityScore}` },
    { id: "flex", label: t("profileHub.chip.flexibility"), value: hub.formatFreeMoney },
    {
      id: "sync",
      label: t("profileHub.chip.sync"),
      value: t(`profileHub.sync.${hub.syncLabel}`),
    },
  ];

  const suffix = [
    salariedFamily ? t("brand.familySuffix") : null,
    hasPowerFeatures(settings) ? t("brand.proSuffix") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="ct-profile-hero ct-reveal">
      <div className="ct-profile-hero-glow" aria-hidden />
      <div className="ct-profile-hero-inner">
        <div className="ct-profile-hero-top">
          <Eyebrow>{t("profileHub.eyebrow")}</Eyebrow>
          <div className="ct-row gap-2 shrink-0">
            <PlansButton />
            <NotificationBell unread={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />
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
            <span className={`ct-profile-state ct-profile-state-${hub.stabilityScore >= 65 ? "ok" : hub.stabilityScore >= 45 ? "mid" : "risk"}`}>
              {hub.stabilityLabel}
            </span>
          </div>
        </button>
        <div className="ct-profile-hero-chips">
          {chips.map((c) => (
            <div key={c.id} className="ct-profile-chip">
              <Caption className="block ct-profile-chip-label">{c.label}</Caption>
              <span className="ct-profile-chip-value">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </section>
  );
}
