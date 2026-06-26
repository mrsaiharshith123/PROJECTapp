import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePerovoScore } from "../../../hooks/usePerovoScore.js";
import { PEROVO_PILLARS } from "../../../constants/metricTaxonomy.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { SubPageHeader } from "../../patterns/SubPageHeader.jsx";
import { ShareScoreIconButton } from "../../patterns/ShareScoreIconButton.jsx";
import { useCountUp } from "../../hooks/useCountUp.js";
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

/** @route /insights/score — Perovo Score breakdown (sub-page of Insights) */
export default function ScoreDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { privacyMode, core: netWorthCore } = useNetWorth();
  const stable = useStabilityIntel();
  const perovo = usePerovoScore();

  const survivalMonths = stable.survival?.survivalMonths ?? perovo.survivalMonths ?? 0;
  const animatedScore = useCountUp(perovo.score, 900);

  const totalAssets = netWorthCore?.totalAssets ?? 0;
  const totalLiabilities = netWorthCore?.totalLiabilities ?? 0;
  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  const ringColor = tierRingColor(perovo.tier?.tone);
  const filledDeg = Math.max(0, Math.min(360, (perovo.score / 100) * 360));

  const goalsOnTrackRatio =
    perovo.pillars?.protection?.score != null ? Math.min(1, perovo.pillars.protection.score / 100) : 0.5;

  const showPayoffShare = Boolean(location.state?.showPayoffShare);

  return (
    <div className="ct-page ct-score-detail pb-8">
      {showPayoffShare ? <Confetti numberOfPieces={180} recycle={false} /> : null}
      <SubPageHeader
        title={t("scoreDetail.pageTitle")}
        onBack={() => navigate("/insights?card=score")}
        action={<ShareScoreIconButton />}
      />

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
            <p className="ct-score-status-chip">{t(`home.perovoScoreStatus.${perovo.tier?.id === "on_track" ? "onTrack" : perovo.tier?.id === "coping" ? "coping" : "atRisk"}`)}</p>
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
            <div key={pillar.id} className={`ct-stat-tile ${pillar.tone} text-center py-3 px-2.5 w-full`}>
              <CtIcon
                name={pillar.icon}
                size={22}
                className={pillar.tone === "teal" ? "text-teal-300" : pillar.tone === "amber" ? "text-amber-300" : "text-violet-300"}
              />
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

      <button
        type="button"
        className="ct-btn ct-btn-primary mx-4 w-[calc(100%-2rem)]"
        onClick={() => navigate("/insights?card=score")}
      >
        {t("scoreDetail.seeFullInsights")}
      </button>
    </div>
  );
}
