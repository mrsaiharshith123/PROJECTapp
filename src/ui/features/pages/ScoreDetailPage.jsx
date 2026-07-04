import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePerovoScore } from "../../../hooks/usePerovoScore.js";
import { PEROVO_PILLARS } from "../../../constants/metricTaxonomy.js";
import { ShareScoreIconButton } from "../../patterns/ShareScoreIconButton.jsx";
import EditorialSubMasthead from "../../patterns/EditorialSubMasthead.jsx";
import { useCountUp } from "../../hooks/useCountUp.js";
import Confetti from "react-confetti";

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

function pillarTipKey(pillarId, debtRatio, survivalMonths) {
  if (pillarId === "cashflow") {
    return debtRatio < 30
      ? "scoreDetail.pillarTip.cashflow.healthy"
      : "scoreDetail.pillarTip.cashflow.constrained";
  }
  if (pillarId === "savings") {
    const mo = survivalMonths ?? 0;
    if (mo >= 6) return "scoreDetail.pillarTip.savings.strong";
    if (mo >= 3) return "scoreDetail.pillarTip.savings.moderate";
    return "scoreDetail.pillarTip.savings.low";
  }
  if (pillarId === "debt") {
    if (debtRatio < 30) return "scoreDetail.pillarTip.debt.healthy";
    if (debtRatio < 60) return "scoreDetail.pillarTip.debt.watch";
    return "scoreDetail.pillarTip.debt.high";
  }
  return "scoreDetail.pillarTip.protection";
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

  const filledDeg = Math.max(0, Math.min(360, (perovo.score / 100) * 360));

  const goalsOnTrackRatio =
    perovo.pillars?.protection?.score != null ? Math.min(1, perovo.pillars.protection.score / 100) : 0.5;

  const showPayoffShare = Boolean(location.state?.showPayoffShare);

  const scoreColor =
    perovo.tier?.tone === "success" || perovo.tier?.tone === "ok"
      ? "var(--ed-green)"
      : perovo.tier?.tone === "warning" || perovo.tier?.tone === "mid"
        ? "var(--ed-gold)"
        : "var(--ed-red)";

  return (
    <div className="ed-page-full ed-ins-page">
      {showPayoffShare ? <Confetti numberOfPieces={180} recycle={false} /> : null}

      <EditorialSubMasthead
        title={t("insights.subpages.scoreTitle")}
        tagline={t("insights.subpages.scoreSubtitle")}
        onBack={() => navigate("/insights")}
        backLabel={t("insights.subpages.back")}
        right={<ShareScoreIconButton />}
      />

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.subpages.scoreKicker")}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              flexShrink: 0,
              background: `conic-gradient(${scoreColor} 0deg ${filledDeg}deg, var(--ed-rule) ${filledDeg}deg 360deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: "50%",
                background: "var(--ed-bg)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--ed-ink)",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {animatedScore}
              </span>
              <span
                style={{
                  fontSize: 9,
                  color: scoreColor,
                  fontWeight: 600,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  marginTop: 1,
                }}
              >
                {t(`perovoScore.tier.${perovo.tier?.id}`)}
              </span>
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 20,
                fontWeight: 600,
                color: "var(--ed-ink)",
              }}
            >
              {t(`perovoScore.tier.${perovo.tier?.id}`)}
            </div>
            <div
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontSize: 13,
                fontStyle: "italic",
                color: "var(--ed-ink-faint)",
                marginTop: 4,
              }}
            >
              {t("analytics.insightScore.subtitle")}
            </div>
          </div>
        </div>
      </div>

      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.subpages.scorePillars")}</div>
        {PEROVO_PILLARS.map((pillar) => {
          const data = perovo.pillars[pillar.id];
          const pillarScore = data?.score ?? 0;
          const color =
            pillarScore >= 70 ? "var(--ed-green)" : pillarScore >= 45 ? "var(--ed-gold)" : "var(--ed-red)";
          let displayValue = privacyMode ? "•••" : `${pillarScore}`;
          if (pillar.id === "debt" && !privacyMode) displayValue = `${debtRatio.toFixed(0)}%`;
          if (pillar.id === "savings" && !privacyMode && survivalMonths != null) {
            displayValue = `${Number(survivalMonths).toFixed(1)}${t("scoreDetail.monthsShort")}`;
          }
          const statusKey = pillarStatusKey(
            pillar.id,
            pillarScore,
            survivalMonths,
            debtRatio,
            goalsOnTrackRatio,
          );
          return (
            <div key={pillar.id} className="ed-ins-pillar-row">
              <div className="ed-ins-pillar-score" style={{ color }}>
                {displayValue}
              </div>
              <div className="ed-ins-pillar-detail">
                <div className="ed-ins-pillar-name">{t(`perovoScore.pillar.${pillar.id}`)}</div>
                <div className="ed-ins-pillar-row-status">{t(statusKey)}</div>
                <div className="ed-ins-pillar-tip">
                  {t(pillarTipKey(pillar.id, debtRatio, survivalMonths))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0 }}
          onClick={() => navigate("/insights")}
        >
          {t("insights.subpages.backFooter")}
        </button>
      </div>
    </div>
  );
}
