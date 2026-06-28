import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { pressureScoreLabel } from "../../../engines/pressureScore.js";
import { freeCashflowTrend } from "../../../engines/analyticsSeries.js";

function buildSparklinePath(points, width, height) {
  if (!points || points.length < 2) return "";
  const values = points.map((p) => p.freeMoney ?? 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values.filter((v) => v > 0), 0);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height * 0.65);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${pts.join(" L ")}`;
}

/** Net position hero — sparkline, score ring once, daily cash-flow stats. */
export default function HomeNetPositionHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { core } = useNetWorth();
  const { monthlySnapshots } = usePerovo();
  const { formatAmount, formatScore, privacyMode } = usePrivacyAmount();
  const { stability, pressureAnalysis, freeMoneyAfterBurden } = useCommitIntel();
  const stable = useStabilityIntel();
  const score = stability?.score ?? pressureAnalysis?.score ?? 0;
  const freeCash = freeMoneyAfterBurden ?? stability?.freeMoney ?? 0;

  const trendData = freeCashflowTrend(monthlySnapshots, 8);
  const hasGraph = trendData.some((d) => d.freeMoney !== null && d.freeMoney > 0);

  const netPosition = core.totalAssets - core.totalLiabilities;
  const positive = netPosition >= 0;
  const meta = pressureScoreLabel(score);
  const scoreLabel = stability?.label || meta.label;
  const isEmpty = core.totalAssets === 0 && core.totalLiabilities === 0;

  const runwayMonths = stable.survival?.months ?? null;
  const burdenRatio = stable.burdenRatio ?? 0;
  const hasIncome = (stable.income ?? 0) > 0;
  const scoreSweep = Math.min(100, Math.max(0, score));

  const scoreColor =
    meta.tone === "danger"
      ? "var(--ed-red)"
      : meta.tone === "warning"
        ? "var(--ed-gold)"
        : "var(--ed-green)";

  const netAmountDisplay = privacyMode
    ? formatAmount(Math.abs(netPosition))
    : Math.abs(netPosition).toLocaleString("en-IN");

  const sparkPath = buildSparklinePath(trendData, 260, 80);
  const lastTrend = trendData[trendData.length - 1];
  const trendValues = trendData.map((d) => d.freeMoney ?? 0);
  const trendMax = Math.max(...trendValues, 1);
  const endpointY =
    lastTrend?.freeMoney != null ? 80 - (lastTrend.freeMoney / trendMax) * 80 * 0.65 : null;

  return (
    <div className="ed-lead">
      <svg
        aria-hidden
        className={`ed-lead-spark${hasGraph ? "" : " ed-lead-spark--hidden"}`}
        viewBox="0 0 260 80"
        width="260"
        height="80"
        preserveAspectRatio="none"
      >
        {hasGraph ? (
          <>
            <defs>
              <linearGradient id="ed-spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ed-green)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--ed-green)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${sparkPath} L 260,80 L 0,80 Z`} fill="url(#ed-spark-grad)" />
            <path
              d={sparkPath}
              fill="none"
              stroke="var(--ed-green)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {endpointY != null ? <circle cx={260} cy={endpointY} r="3" fill="var(--ed-green)" /> : null}
          </>
        ) : null}
      </svg>

      <div className="ed-kicker">{t("home.ed.leadKicker")}</div>
      {isEmpty ? <p className="ed-lead-hint">{t("home.ed.headlineEmpty")}</p> : null}

      <div className="ed-lead-body">
        <div className="ed-lead-hero-row">
          <button type="button" className="ed-lead-tap" onClick={() => navigate("/ledger")}>
            <div className="ed-bignum">
              {!privacyMode ? <span className="sym">₹</span> : null}
              {positive ? "" : "−"}
              {netAmountDisplay}
            </div>
          </button>
          <div className="ed-lead-links">
            <button type="button" className="ed-byline-link" onClick={() => navigate("/ledger")}>
              {t("home.position.tapLedger")}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="ed-score-row"
          onClick={() => navigate("/insights?card=score")}
        >
          <div
            className="ed-score-ring-wrap"
            style={{
              background: `conic-gradient(${scoreColor} 0deg ${scoreSweep * 3.6}deg, var(--ed-rule) ${scoreSweep * 3.6}deg 360deg)`,
            }}
          >
            <div className="ed-score-ring-inner ed-score-ring-inner--sm">
              <span className="ed-score-num">{formatScore(score)}</span>
            </div>
          </div>
          <div className="ed-score-copy">
            <div className="ed-score-label">{scoreLabel}</div>
            <div className="ed-score-sub">{t("home.position.scoreLabel")}</div>
          </div>
          <span className="ed-score-arrow-btn">{t("home.position.tapScore")}</span>
        </button>

        {hasIncome ? (
          <div className="ed-lead-stats">
            <div className="ed-lead-stat">
              <span className="ed-lead-stat-label">{t("home.ed.statFree")}</span>
              <span
                className="ed-lead-stat-val"
                style={{ color: freeCash > 0 ? "var(--ed-green)" : "var(--ed-red)" }}
              >
                {formatAmount(freeCash)}
              </span>
            </div>
            {runwayMonths !== null ? (
              <div className="ed-lead-stat">
                <span className="ed-lead-stat-label">{t("home.ed.statRunway")}</span>
                <span
                  className="ed-lead-stat-val"
                  style={{ color: runwayMonths > 3 ? "var(--ed-green)" : "var(--ed-gold)" }}
                >
                  {runwayMonths.toFixed(1)} mo
                </span>
              </div>
            ) : null}
            {burdenRatio > 0 ? (
              <div className="ed-lead-stat">
                <span className="ed-lead-stat-label">{t("home.ed.statBurden")}</span>
                <span
                  className="ed-lead-stat-val"
                  style={{ color: burdenRatio > 0.6 ? "var(--ed-red)" : "var(--ed-ink-soft)" }}
                >
                  {(burdenRatio * 100).toFixed(0)}%
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
