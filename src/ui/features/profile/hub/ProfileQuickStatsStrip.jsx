import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../../hooks/useStabilityIntel.js";
import { translatePressureLabel } from "../../../../i18n/engineLabels.js";
import { formatInr } from "../../../../constants/symbols.js";
import { MetricOwnerLink } from "../../../patterns/MetricOwnerLink.jsx";

/** Ambient context row — monthly burden only; score/runway link to their owner screens. */
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
      <div className="ct-profile-quick-links">
        <MetricOwnerLink
          label={t("perovoScore.title")}
          value={`${pressureScore} · ${translatePressureLabel(t, intel.stability?.label)}`}
          to="/"
        />
        {runway != null ? (
          <MetricOwnerLink
            label={t("profileHub.quickRunway")}
            value={t("profileHub.quickRunwayValue", { months: runway.toFixed(1) })}
            to="/money/insights"
          />
        ) : null}
      </div>
    </div>
  );
}
