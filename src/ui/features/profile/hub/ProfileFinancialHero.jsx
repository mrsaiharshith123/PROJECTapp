import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserModeConfig } from "../../../../constants/userModes.js";
import { resolveUserMode, hasPowerFeatures, isSalariedFamily } from "../../../../constants/modeExperience.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../../hooks/useCommitIntel.js";
import { useNetWorthIntel } from "../../../../hooks/useNetWorthIntel.js";
import { useProfileScoreGuide } from "../../../../hooks/useProfileScoreGuide.js";
import { translatePressureLabel } from "../../../../i18n/engineLabels.js";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import { formatInr } from "../../../../constants/symbols.js";
import { buildWealthDailySeries } from "../../../../utils/wealthDailySeries.js";
import ProfileAvatar from "../ProfileAvatar.jsx";
import { Caption, Eyebrow, Heading } from "../../../primitives/Text.jsx";
import { CtIcon } from "../../../icons/CtIcon.jsx";
import { PlansButton } from "../../../patterns/PlansButton.jsx";
import { NotificationBell } from "../../../patterns/NotificationBell.jsx";
import { NotificationPanel } from "../../NotificationPanel.jsx";
import { NetWorthGrowthSparkline } from "../../../patterns/NetWorthGrowthSparkline.jsx";
import { useCountUp } from "../../../hooks/useCountUp.js";

/**
 * Unified financial life card — one responsive tile like Home salary card.
 */
export default function ProfileFinancialHero({
  settings,
  updateSettings,
  onOpenAccount,
  onOpenSettings,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const intel = useNetWorthIntel();
  const { privacyMode, togglePrivacyMode, dailySnapshots, entries } = useNetWorth();
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

  const animated = useCountUp(intel.core.netWorth);
  const display = privacyMode ? "••••••" : formatInr(animated);
  const monthly = intel.growth.monthlyPct;

  const sparkSeries = useMemo(
    () =>
      buildWealthDailySeries(
        dailySnapshots,
        entries,
        settings.activeProfileId || "default",
        intel.core.totalAssets,
        intel.core.totalLiabilities,
        settings.accountCreatedAt || 0,
      ),
    [
      dailySnapshots,
      entries,
      settings.activeProfileId,
      settings.accountCreatedAt,
      intel.core.totalAssets,
      intel.core.totalLiabilities,
    ],
  );

  const sparkRising =
    sparkSeries.length < 2 ||
    sparkSeries[sparkSeries.length - 1].assets >= (sparkSeries[0]?.assets ?? 0);

  const growthLabel = useMemo(() => {
    if (privacyMode) return "••••";
    if (monthly != null) {
      return `${monthly >= 0 ? "+" : ""}${monthly.toFixed(1)}% ${t("netWorth.hero.thisMonth")}`;
    }
    if (intel.core.totalLiabilities > 0) {
      return formatInr(intel.core.netWorth);
    }
    return formatInr(intel.core.totalAssets || intel.core.netWorth);
  }, [privacyMode, monthly, intel.core, t]);

  const stopBubble = (e) => e.stopPropagation();

  return (
    <section className="ct-hero-month ct-hero-month-financial ct-profile-life-card ct-reveal">
      <div className="ct-hero-month-glow" aria-hidden />

      <div className="ct-row-between px-1 pt-1 pb-2 relative">
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

      <button
        type="button"
        className="ct-profile-life-body"
        onClick={() => navigate("/profile/analytics")}
        aria-label={t("profile.openWealthAnalytics")}
      >
        <div className="ct-row-between px-1 mt-1 relative">
          <p className="ct-eyebrow">{t("netWorth.hero.eyebrow")}</p>
          {!privacyMode ? (
            <span className={`ct-nw-status ct-nw-status-${intel.emotionalStatus}`}>
              {t(intel.emotionalStatusKey)}
            </span>
          ) : null}
        </div>

        <p className="ct-profile-life-nw-value ct-numeral px-1 relative">{display}</p>

        <div className="px-1 mt-3 relative">
          <div className="ct-row-between ct-caption mb-1">
            <span>{t("profile.netWorthGrowthTitle")}</span>
            <span className={sparkRising ? "ct-hero-metric-success" : "ct-hero-metric-warn"}>{growthLabel}</span>
          </div>
        </div>

        <div className="ct-hero-spend-footer relative">
          {!privacyMode && sparkSeries.length > 0 ? (
            <NetWorthGrowthSparkline data={sparkSeries} />
          ) : (
            <Caption className="block text-center py-4 px-1 opacity-75">
              {t("profile.analytics.sparklineHint")}
            </Caption>
          )}
        </div>

        <p className="ct-caption text-center pb-1 pt-1 relative opacity-80">{t("profile.tapAnalytics")}</p>
      </button>

      <div className="ct-profile-hero-chips-row px-1 pb-3 relative" onClick={stopBubble}>
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
                <Caption className="block ct-profile-chip-sub">
                  {t(chip.subKey, chip.subParams || {})}
                </Caption>
              ) : null}
            </div>
          ))}
        </div>
        <Link
          to="/profile/scores"
          className="ct-profile-chip-plus"
          aria-label={t("profileHub.scoresDetailLink")}
          onClick={stopBubble}
        >
          <CtIcon name="plus" size={20} />
        </Link>
      </div>

      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </section>
  );
}
