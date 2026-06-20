import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, addDays } from "date-fns";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePerovoScore } from "../../../hooks/usePerovoScore.js";
import { computeSafeToSpendDaily } from "../../../engines/safeToSpend.js";
import { PressureRing } from "../../patterns/PressureRing.jsx";
import { formatInr } from "../../../constants/symbols.js";

function scoreTierKey(score) {
  if (score >= 70) return "perovoScore.tier.on_track";
  if (score >= 40) return "perovoScore.tier.coping";
  return "perovoScore.tier.at_risk";
}

function scoreStatusKey(score) {
  if (score >= 70) return "home.perovoScoreStatus.onTrack";
  if (score >= 40) return "home.perovoScoreStatus.coping";
  return "home.perovoScoreStatus.atRisk";
}

/**
 * Home hero — ONE Perovo Score + free cash (with daily safe caption) + runway.
 * @param {{
 *   paycheckBuffer?: number,
 *   salaryCreditDay?: number | null,
 *   todayStr: string,
 *   isFamily?: boolean,
 * }} props
 */
export default function HomePressureHero({
  paycheckBuffer = 0,
  salaryCreditDay = null,
  todayStr,
  isFamily = false,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const perovo = usePerovoScore();

  const score = perovo.score ?? 0;
  const tierLabel = t(scoreTierKey(score));
  const freeCash = Math.max(0, Math.round(intel.freeMoneyAfterBurden ?? 0));
  const runwayMonths = stable.survival?.survivalMonths;

  const trendChip = useMemo(() => {
    const recent = (stable.pressureIntel?.trend || []).filter((row) => row.pressure > 0);
    if (recent.length < 2) return null;
    const pressureDelta = Math.round(recent[recent.length - 1].pressure - recent[0].pressure);
    const scoreDelta = -pressureDelta;
    if (Math.abs(scoreDelta) < 1) return null;
    return scoreDelta > 0
      ? t("home.trendChipUp", { pts: scoreDelta })
      : t("home.trendChipDown", { pts: Math.abs(scoreDelta) });
  }, [stable.pressureIntel?.trend, t]);

  const safeCaption = useMemo(() => {
    if (!salaryCreditDay || paycheckBuffer <= 0) return null;
    const safe = computeSafeToSpendDaily({
      bufferAfterBills: paycheckBuffer,
      salaryCreditDay,
      todayStr,
    });
    if (safe.daily <= 0 || safe.daysUntilSalary == null) return null;
    let untilLabel = "";
    try {
      const until = addDays(parseISO(`${todayStr}T12:00:00`), safe.daysUntilSalary);
      untilLabel = format(until, "d MMM");
    } catch {
      return null;
    }
    return t("home.safeToSpendDaily", { amount: formatInr(safe.daily), date: untilLabel });
  }, [paycheckBuffer, salaryCreditDay, todayStr, t]);

  const runwayLabel = isFamily ? t("home.strip.familyRunway") : t("home.strip.runway");
  const ringAria = t("home.perovoScoreAria", { score, tier: tierLabel });

  return (
    <button
      type="button"
      className="ct-hero-card pressure w-full text-left ct-pressable ct-home-enter-item"
      style={{ animationDelay: "0ms" }}
      onClick={() => navigate("/profile/scores")}
    >
      <div className="ct-hero-glow" aria-hidden />
      <p className="ct-hero-label">{t("home.perovoScore")}</p>

      <div className="ct-home-hero-main">
        <PressureRing
          score={score}
          size={108}
          variant="conic"
          scoreMode="perovo"
          tierLabel={tierLabel}
          ariaLabel={ringAria}
        />
        <div className="ct-home-hero-aside">
          {trendChip ? <span className="ct-trend-chip">{trendChip}</span> : null}
          <p className="ct-home-hero-status">{t(scoreStatusKey(score))}</p>
        </div>
      </div>

      <div className="ct-home-hero-divider" aria-hidden />

      <div className="ct-home-hero-stats">
        <div className="ct-home-hero-stat">
          <p className="ct-stat-label">{isFamily ? t("home.householdCash") : t("home.freeCash")}</p>
          <p className="ct-stat-value ct-home-stat-gold">{formatInr(freeCash)}</p>
          {safeCaption ? <p className="ct-home-hero-safe-caption">{safeCaption}</p> : null}
        </div>
        <div className="ct-home-hero-stat">
          <p className="ct-stat-label">{runwayLabel}</p>
          <p className="ct-stat-value ct-home-stat-runway">
            {runwayMonths != null && Number.isFinite(runwayMonths)
              ? `${Math.min(99, Math.round(runwayMonths * 10) / 10)} ${t("home.runwayMonths")}`
              : "—"}
          </p>
        </div>
      </div>
    </button>
  );
}
