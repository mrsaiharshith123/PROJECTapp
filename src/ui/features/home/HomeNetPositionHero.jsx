import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { pressureScoreLabel } from "../../../engines/pressureScore.js";

/** Net position hero — editorial lead story (single score line per mockup). */
export default function HomeNetPositionHero() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { core } = useNetWorth();
  const { formatAmount, formatScore, privacyMode } = usePrivacyAmount();
  const { stability, pressureAnalysis } = useCommitIntel();
  const score = stability?.score ?? pressureAnalysis?.score ?? 0;

  const netPosition = core.totalAssets - core.totalLiabilities;
  const positive = netPosition >= 0;
  const meta = pressureScoreLabel(score);
  const scoreLabel = stability?.label || meta.label;

  const headline = useMemo(() => {
    if (core.totalAssets > 0 && core.totalLiabilities > 0) {
      return t("home.ed.headlineStable");
    }
    if (core.totalAssets === 0 && core.totalLiabilities === 0) {
      return t("home.ed.headlineBuilding");
    }
    return t("home.ed.headlinePosition");
  }, [core.totalAssets, core.totalLiabilities, t]);

  const scoreColor =
    meta.tone === "danger"
      ? "var(--ed-red)"
      : meta.tone === "warning"
        ? "var(--ed-gold)"
        : "var(--ed-green)";

  const netAmountDisplay = privacyMode
    ? formatAmount(Math.abs(netPosition))
    : Math.abs(netPosition).toLocaleString("en-IN");

  return (
    <div className="ed-lead">
      <div className="ed-kicker">{t("home.ed.leadKicker")}</div>
      <div className="ed-headline">{headline}</div>

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
            <button type="button" className="ed-byline-link" onClick={() => navigate("/insights?card=score")}>
              {t("home.position.readScore")}
            </button>
          </div>
        </div>

        <div className="ed-byline">
          <span className="ed-byline-dot" style={{ background: scoreColor }} />
          <span>
            {scoreLabel} · {t("home.position.scoreInline", { score: formatScore(score) })}
          </span>
        </div>
      </div>
    </div>
  );
}
