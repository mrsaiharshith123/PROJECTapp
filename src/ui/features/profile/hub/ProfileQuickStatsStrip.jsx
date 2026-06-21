import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../../hooks/useStabilityIntel.js";
import { translatePressureLabel } from "../../../../i18n/engineLabels.js";
import { formatInr } from "../../../../constants/symbols.js";

function pressureColor(score) {
  if (score >= 70) return "var(--ct-success)";
  if (score >= 40) return "#fbbf24";
  return "var(--ct-danger)";
}

/** Ambient context row below the profile hero — read-only summary tiles. */
export default function ProfileQuickStatsStrip() {
  const { t } = useTranslation();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const pressureScore = intel.stability?.score ?? 0;
  const runway = stable.survival?.survivalMonths;

  return (
    <div className="ct-profile-quick-stats ct-reveal ct-reveal-delay-1">
      <div className="ct-stat-tile ct-profile-quick-stat">
        <span className="ct-stat-tile-label">{t("profileHub.quickThisMonth")}</span>
        <span className="ct-stat-tile-value">{formatInr(Math.round(intel.monthlyBurden ?? 0))}</span>
      </div>
      <div className="ct-stat-tile ct-profile-quick-stat">
        <span className="ct-stat-tile-label">{t("profileHub.quickPressure")}</span>
        <span className="ct-stat-tile-value" style={{ color: pressureColor(pressureScore) }}>
          {pressureScore} — {translatePressureLabel(t, intel.stability?.label)}
        </span>
      </div>
      <div className="ct-stat-tile ct-profile-quick-stat">
        <span className="ct-stat-tile-label">{t("profileHub.quickRunway")}</span>
        <span className="ct-stat-tile-value" style={{ color: "#fbbf24" }}>
          {runway != null ? t("profileHub.quickRunwayValue", { months: runway.toFixed(1) }) : "—"}
        </span>
      </div>
    </div>
  );
}
