import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isSalariedFamily, getHouseholdModeDisplay } from "../../../../constants/modeExperience.js";
import { getTier } from "../../../../utils/tierAccess.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { useNetWorthIntel } from "../../../../hooks/useNetWorthIntel.js";
import { usePerovoScore } from "../../../../hooks/usePerovoScore.js";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useCommitIntel } from "../../../../hooks/useCommitIntel.js";
import { computeGoalIntel } from "../../../../engines/goalsProgress.js";
import { monthlyBurdenForCommitment } from "../../../../engines/burden.js";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import { formatInr } from "../../../../constants/symbols.js";
import ProfileAvatar from "../ProfileAvatar.jsx";
import PlansModal from "../PlansModal.jsx";
import { Caption, Heading } from "../../../primitives/Text.jsx";
import { CtIcon } from "../../../icons/CtIcon.jsx";
import { useCountUp } from "../../../hooks/useCountUp.js";

function scoreColor(score) {
  if (score >= 70) return "var(--ct-success)";
  if (score >= 40) return "#fbbf24";
  return "var(--ct-danger)";
}

/**
 * Identity hero — who you are + three vital numbers (You tab block 1).
 */
export default function ProfileFinancialHero({
  settings,
  updateSettings,
  onOpenAccount,
  onOpenSettings,
  onOpenIncome,
  incomeMissing = false,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const intel = useNetWorthIntel();
  const perovo = usePerovoScore();
  const commitIntel = useCommitIntel();
  const { goals, commitments, getEffectiveStatus, todayStr } = usePerovo();
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const [plansOpen, setPlansOpen] = useState(false);

  const modeDisplay = getHouseholdModeDisplay(settings);
  const name = settings.displayName?.trim() || t("brand.defaultUser");
  const tier = getTier(settings);
  const tierBadgeClass =
    tier === "power" ? "ct-tier-badge-power" : tier === "pro" ? "ct-tier-badge-pro" : "ct-tier-badge-free";
  const tierLabel =
    tier === "power" ? t("plans.tier.power") : tier === "pro" ? t("plans.tier.pro") : t("plans.tier.free");

  const animatedNw = useCountUp(intel.core.netWorth);
  const netWorthDisplay = privacyMode ? "••••••" : formatInr(animatedNw);
  const score = perovo.score ?? 0;
  const scoreDisplay = privacyMode ? "•••" : String(score);

  const { goalsOnTrack, goalsTotal } = useMemo(() => {
    const active = goals.filter((g) => !g.archived);
    if (!active.length) return { goalsOnTrack: 0, goalsTotal: 0 };
    const openRemaining = commitments.reduce(
      (s, c) => s + monthlyBurdenForCommitment(c, getEffectiveStatus),
      0,
    );
    let onTrack = 0;
    active.forEach((g) => {
      const saved =
        g.type === "save_amount" || g.type === "education" || g.type === "wedding"
          ? Number(g.savedAmount) || 0
          : 0;
      const row = computeGoalIntel(
        g,
        {
          openRemainingSum: openRemaining,
          burdenRatio: commitIntel.burdenRatio,
          savedAmountTowardGoal: saved,
        },
        todayStr,
      );
      if (row.status === "on_track" || row.progress >= 0.5) onTrack += 1;
    });
    return { goalsOnTrack: onTrack, goalsTotal: active.length };
  }, [goals, commitments, getEffectiveStatus, commitIntel.burdenRatio, todayStr]);

  const goalsTone = goalsTotal === 0 || goalsOnTrack === goalsTotal ? "ok" : "watch";
  const goalsDisplay = privacyMode
    ? "•••"
    : goalsTotal
      ? t("profileHub.heroGoalsValue", { onTrack: goalsOnTrack, total: goalsTotal })
      : "—";

  const openPlans = () => {
    if (tier === "power") return;
    setPlansOpen(true);
  };

  return (
    <>
      <section className="ct-hero-card wealth ct-profile-identity-hero ct-reveal">
        <div className="ct-hero-glow teal" aria-hidden />

        <div className="ct-profile-identity-actions">
          <button
            type="button"
            className="ct-ghost-icon-btn"
            onClick={togglePrivacyMode}
            aria-label={privacyMode ? t("netWorth.privacy.show") : t("netWorth.privacy.hide")}
          >
            <CtIcon name={privacyMode ? "eye-slash" : "eye"} size={18} />
          </button>
          <button
            type="button"
            className="ct-ghost-icon-btn"
            onClick={onOpenSettings}
            aria-label={t("profileHub.openSettings")}
          >
            <CtIcon name="gear" size={18} />
          </button>
        </div>

        <div className="ct-profile-identity-row">
          <button type="button" className="ct-profile-identity-main" onClick={onOpenAccount}>
            <ProfileAvatar settings={settings} updateSettings={updateSettings} size="lg" compact />
            <div className="ct-profile-identity-text">
              <Heading level={2} className="ct-profile-identity-name">
                {name}
              </Heading>
              <Caption className="block">
                <span className="inline-flex items-center gap-1">
                  <CtIcon name={modeDisplay.icon} size={14} />
                  {t(modeDisplay.labelKey)}
                  {isSalariedFamily(settings) ? ` · ${t("brand.familySuffix")}` : ""}
                </span>
              </Caption>
            </div>
          </button>
          <button
            type="button"
            className={`ct-tier-badge ${tierBadgeClass}`}
            onClick={openPlans}
            aria-label={t("profileHub.heroTierAria", { tier: tierLabel })}
          >
            {tier === "power" ? "⚡ " : tier === "pro" ? "✦ " : ""}
            {tierLabel}
          </button>
        </div>

        <div className="ct-profile-identity-divider" aria-hidden />

        {incomeMissing ? (
          <button type="button" className="ct-profile-identity-income-cta" onClick={onOpenIncome}>
            {t("profileHub.heroSetIncomeCta")}
          </button>
        ) : (
          <div className="ct-profile-identity-stats">
            <button
              type="button"
              className="ct-profile-identity-stat"
              onClick={() => navigate("/net-worth")}
              aria-label={t("profileHub.heroStatNetWorthAria", { value: netWorthDisplay })}
            >
              <Caption className="ct-profile-identity-stat-label">{t("profileHub.heroStatNetWorth")}</Caption>
              <span className="ct-profile-identity-stat-value ct-profile-identity-stat-gold">{netWorthDisplay}</span>
            </button>
            <button
              type="button"
              className="ct-profile-identity-stat"
              onClick={() => navigate("/profile/scores")}
              aria-label={t("profileHub.heroStatScoreAria", { score: scoreDisplay })}
            >
              <Caption className="ct-profile-identity-stat-label">{t("perovoScore.title")}</Caption>
              <span className="ct-profile-identity-stat-value" style={{ color: scoreColor(score) }}>
                {scoreDisplay}
              </span>
            </button>
            <button
              type="button"
              className="ct-profile-identity-stat"
              onClick={() => navigate("/plan")}
              aria-label={t("profileHub.heroStatGoalsAria", { value: goalsDisplay })}
            >
              <Caption className="ct-profile-identity-stat-label">{t("nav.plan")}</Caption>
              <span
                className={`ct-profile-identity-stat-value ${
                  goalsTone === "ok" ? "ct-profile-identity-stat-teal" : "ct-profile-identity-stat-amber"
                }`}
              >
                {goalsDisplay}
              </span>
            </button>
          </div>
        )}

        {privacyMode ? (
          <button type="button" className="ct-profile-identity-privacy-bar" onClick={togglePrivacyMode}>
            {t("profileHub.heroPrivacyOn")}
          </button>
        ) : null}
      </section>

      <PlansModal open={plansOpen} onClose={() => setPlansOpen(false)} />
    </>
  );
}
