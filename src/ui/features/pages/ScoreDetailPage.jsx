import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { usePerovoScore } from "../../../hooks/usePerovoScore.js";
import { useProfileScoreGuide } from "../../../hooks/useProfileScoreGuide.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { computeCurrentMonthSummary } from "../../../utils/monthPaymentSummary.js";
import { formatInr } from "../../../constants/symbols.js";
import { PEROVO_PILLARS } from "../../../constants/metricTaxonomy.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { useCountUp } from "../../hooks/useCountUp.js";
import { Button } from "../../primitives/Button.jsx";
import PerovoShareCard from "../sharing/PerovoShareCard.jsx";
import Confetti from "react-confetti";

function tierRingColor(tone) {
  if (tone === "success" || tone === "ok") return "#2dd4bf";
  if (tone === "warning" || tone === "warn" || tone === "mid") return "#fbbf24";
  return "#f87171";
}

function pillarStatusKey(pillarId, score, survivalMonths, debtRatio, goalsRatio) {
  if (pillarId === "cashflow") {
    if (score >= 55) return "scoreDetail.pillarStatus.onTrack";
    if (score >= 35) return "scoreDetail.pillarStatus.watch";
    return "scoreDetail.pillarStatus.atRisk";
  }
  if (pillarId === "savings") {
    const mo = survivalMonths ?? 0;
    if (mo >= 6) return "scoreDetail.pillarStatus.strong";
    if (mo >= 3) return "scoreDetail.pillarStatus.moderate";
    return "scoreDetail.pillarStatus.low";
  }
  if (pillarId === "debt") {
    if (debtRatio < 30) return "scoreDetail.pillarStatus.healthy";
    if (debtRatio < 60) return "scoreDetail.pillarStatus.watch";
    return "scoreDetail.pillarStatus.high";
  }
  if (goalsRatio >= 0.8) return "scoreDetail.pillarStatus.onTrack";
  return "scoreDetail.pillarStatus.behind";
}

export default function ScoreDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { commitments, lendings, dailySpends, settings, getEffectiveStatus, getEffectiveLendingStatus, todayStr, monthlySnapshots } =
    usePerovo();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const perovo = usePerovoScore();
  const guide = useProfileScoreGuide();
  const { privacyMode, core: netWorthCore } = useNetWorth();

  const income = combinedMonthlyIncome(settings);
  const monthSummary = useMemo(
    () =>
      computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr, income, {
        dailySpends,
        lendings,
        getEffectiveLendingStatus,
        profileId: settings.activeProfileId || "default",
      }),
    [commitments, lendings, dailySpends, getEffectiveStatus, getEffectiveLendingStatus, todayStr, income, settings.activeProfileId],
  );

  const dailySafe = monthSummary.spendGuidance?.dailyTotalCap ?? 0;
  const freeCash = Math.max(0, Math.round(intel.freeMoneyAfterBurden ?? 0));
  const survivalMonths = stable.survival?.survivalMonths ?? perovo.survivalMonths ?? 0;
  const animatedScore = useCountUp(perovo.score, 900);

  const totalAssets = netWorthCore?.totalAssets ?? 0;
  const totalLiabilities = netWorthCore?.totalLiabilities ?? 0;
  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  const sortedSnaps = [...(monthlySnapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
  const prevPressure =
    sortedSnaps.length >= 2 ? sortedSnaps[sortedSnaps.length - 2].pressureScore : null;
  const pressureDelta =
    prevPressure != null && intel.stability?.score != null ? intel.stability.score - prevPressure : null;

  const ringColor = tierRingColor(perovo.tier?.tone);
  const filledDeg = Math.max(0, Math.min(360, (perovo.score / 100) * 360));

  const statusMessageKey = `home.perovoScoreStatus.${perovo.tier?.id === "on_track" ? "onTrack" : perovo.tier?.id === "coping" ? "coping" : "atRisk"}`;

  const trendLine =
    pressureDelta != null && pressureDelta <= -3
      ? t("scoreDetail.trendUp")
      : pressureDelta != null && pressureDelta >= 3
        ? t("scoreDetail.trendDown", { delta: pressureDelta })
        : t("scoreDetail.trendFlat");

  const goalsOnTrackRatio =
    perovo.pillars?.protection?.score != null ? Math.min(1, perovo.pillars.protection.score / 100) : 0.5;

  const showPayoffShare = Boolean(location.state?.showPayoffShare);
  const payoffLoanName = location.state?.loanName;
  const [shareOpen, setShareOpen] = useState(showPayoffShare);

  return (
    <div className="ct-page ct-score-detail pb-8">
      {showPayoffShare ? <Confetti numberOfPieces={180} recycle={false} /> : null}
      <header className="ct-subpage-header">
        <button type="button" className="ct-back-btn" onClick={() => navigate(-1)} aria-label={t("common.back")}>
          <CtIcon name="arrow-left" size={18} />
        </button>
        <span className="ct-subpage-title">{t("scoreDetail.pageTitle")}</span>
        <span className="ct-subpage-spacer" aria-hidden />
      </header>

      <div className="pos-tile instrument mx-4">
        <div
          className="ct-hero-glow"
          aria-hidden
          style={{
            background:
              perovo.tier?.tone === "success"
                ? "var(--ct-glow-teal)"
                : perovo.tier?.tone === "warning"
                  ? "var(--ct-glow-amber)"
                  : "radial-gradient(circle,rgba(220,38,38,0.3),transparent 70%)",
          }}
        />
        <p className="ct-hero-label">{t("perovoScore.title")}</p>
        <div className="ct-row gap-5 mt-3 items-center relative">
          <div
            className="ct-conic-ring shrink-0"
            style={{
              width: 108,
              height: 108,
              background: `conic-gradient(${ringColor} 0deg ${filledDeg}deg, rgba(255,255,255,0.08) ${filledDeg}deg 360deg)`,
            }}
          >
            <div className="ct-conic-ring-inner" style={{ width: 84, height: 84 }}>
              <span className="ct-score-ring-num ct-numeral">{animatedScore}</span>
              <span className="ct-score-ring-tier" style={{ color: ringColor }}>
                {t(`perovoScore.tier.${perovo.tier?.id}`)}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs mb-1.5" style={{ color: ringColor }}>
              {trendLine}
            </p>
            <p className="ct-score-status-chip">{t(statusMessageKey)}</p>
          </div>
        </div>

        <div className="ct-row gap-2 mt-3.5 relative">
          <div className="ct-stat-tile flex-1">
            <p className="ct-stat-label">{t("home.freeCash")}</p>
            <p className="ct-stat-value" style={{ color: "#fcd34d" }}>
              {privacyMode ? "••••" : formatInr(freeCash)}
            </p>
            {dailySafe > 0 && !privacyMode ? (
              <p className="text-[10px] text-[var(--ct-text-muted)] mt-0.5">
                {t("scoreDetail.dailySafe", { amount: formatInr(Math.round(dailySafe)) })}
              </p>
            ) : null}
          </div>
          <div className="ct-stat-tile flex-1">
            <p className="ct-stat-label">{t("scoreDetail.runway")}</p>
            <p className="ct-stat-value ct-numeral" style={{ color: "#fbbf24" }}>
              {survivalMonths != null ? `${Number(survivalMonths).toFixed(1)} ${t("scoreDetail.monthsShort")}` : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="ct-grid-2 gap-2 mx-4">
        {PEROVO_PILLARS.map((pillar) => {
          const data = perovo.pillars[pillar.id];
          const score = data?.score ?? 0;
          const color = tierRingColor(score >= 70 ? "success" : score >= 45 ? "warning" : "danger");
          let displayValue = privacyMode ? "•••" : `${score}`;
          if (pillar.id === "debt" && !privacyMode) displayValue = `${debtRatio.toFixed(0)}%`;
          if (pillar.id === "savings" && !privacyMode && survivalMonths != null) {
            displayValue = `${Number(survivalMonths).toFixed(1)}${t("scoreDetail.monthsShort")}`;
          }
          return (
            <div key={pillar.id} className={`ct-stat-tile ${pillar.tone} text-center py-3 px-2.5`}>
              <CtIcon name={pillar.icon} size={22} className={pillar.tone === "teal" ? "text-teal-300" : pillar.tone === "amber" ? "text-amber-300" : "text-violet-300"} />
              <p className="ct-stat-label mt-1">{t(`perovoScore.pillar.${pillar.id}`)}</p>
              <p className="ct-stat-value ct-numeral mt-0.5" style={{ color }}>
                {displayValue}
              </p>
              <p className="text-[10px] text-[var(--ct-text-muted)] mt-0.5">
                {t(pillarStatusKey(pillar.id, score, survivalMonths, debtRatio, goalsOnTrackRatio))}
              </p>
            </div>
          );
        })}
      </div>

      {guide.focusFirst ? (
        <button
          type="button"
          className="ct-attention-row mx-4 mb-3 w-[calc(100%-2rem)] text-left"
          onClick={() => navigate("/money/bills")}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#f87171]">{t("profileHub.scoreFix.payFirst")}</p>
            <p className="text-sm text-[var(--ct-text)] mt-0.5">{guide.focusFirst.name}</p>
            <p className="text-[11px] text-[var(--ct-text-muted)] mt-0.5">
              {guide.payoffOrder[0]?.amount
                ? formatInr(guide.payoffOrder[0].amount)
                : null}
              {guide.focusFirst.message ? ` · ${guide.focusFirst.message}` : ""}
            </p>
          </div>
          <CtIcon name="arrow-right" size={16} className="text-red-400 shrink-0" />
        </button>
      ) : null}

      {shareOpen ? (
        <div className="mx-4 mb-3">
          <PerovoShareCard
            score={perovo.score}
            tierLabel={t(`perovoScore.tier.${perovo.tier?.id}`)}
            tierTone={perovo.tier?.tone}
            freeCash={freeCash}
            runwayMonths={survivalMonths}
            variant={showPayoffShare ? "payoff" : "score"}
            loanName={payoffLoanName}
            headline={
              pressureDelta != null && pressureDelta <= -10
                ? t("scoreDetail.trendUp")
                : undefined
            }
          />
        </div>
      ) : null}

      <Button type="button" variant="primary" className="mx-4 w-[calc(100%-2rem)]" onClick={() => setShareOpen(true)}>
        {t("scoreDetail.shareScore")}
      </Button>

      <Button type="button" variant="outline" className="mx-4 w-[calc(100%-2rem)]" onClick={() => navigate("/money/insights")}>
        {t("scoreDetail.viewAnalytics")}
      </Button>

      <Button type="button" variant="ghost" className="mx-4 w-[calc(100%-2rem)]" onClick={() => navigate("/profile/scores")}>
        {t("scoreDetail.viewScoreBreakdown")}
      </Button>
    </div>
  );
}
