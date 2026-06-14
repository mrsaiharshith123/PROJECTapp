import { useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Card, Caption } from "../../index.js";

function toneColor(score) {
  if (score == null || Number.isNaN(score)) return "var(--ct-text-muted)";
  if (score < 45) return "var(--ct-success)";
  if (score < 70) return "var(--ct-warning)";
  return "var(--ct-danger)";
}

export default function StickyStatusStrip() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useCommitTrack();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const { privacyMode } = useNetWorth();
  const isFamily = isSalariedFamily(settings);
  const HIDDEN = "••••";

  const pressure = intel.stability?.score ?? null;
  const freeCash = intel.stability?.freeMoney ?? null;
  const survival = stable.survival?.survivalMonths ?? null;

  const goAnalytics = () => navigate("/analytics");

  return (
    <Card variant="flat" className="ct-status-tile">
      <Caption className="block mb-2 font-semibold">
        {isFamily ? t("home.statusTile.familyTitle") : t("home.statusTile.title")}
      </Caption>
      <div className="ct-status-tile-row">
        <button type="button" className="ct-status-pill" onClick={goAnalytics}>
          <span className="ct-status-num ct-numeral" style={{ color: toneColor(pressure) }}>
            {pressure != null ? `${Math.round(pressure)}` : "—"}
          </span>
          <span className="ct-status-label">
            {isFamily ? t("home.strip.familyPressure") : t("home.strip.pressure")}
          </span>
        </button>
        <button type="button" className="ct-status-pill" onClick={goAnalytics}>
          <span
            className="ct-status-num ct-numeral"
            style={{ color: freeCash != null && freeCash >= 0 ? "var(--ct-success)" : "var(--ct-danger)" }}
          >
            {privacyMode ? HIDDEN : freeCash != null ? formatInr(freeCash) : "—"}
          </span>
          <span className="ct-status-label">
            {isFamily ? t("home.strip.householdFree") : t("home.strip.freeCash")}
          </span>
        </button>
        <button type="button" className="ct-status-pill" onClick={goAnalytics}>
          <span
            className="ct-status-num ct-numeral"
            style={{
              color:
                survival != null
                  ? survival >= 6
                    ? "var(--ct-success)"
                    : survival >= 3
                      ? "var(--ct-warning)"
                      : "var(--ct-danger)"
                  : "var(--ct-text-muted)",
            }}
          >
            {survival != null ? `${Number(survival).toFixed(1)}m` : "—"}
          </span>
          <span className="ct-status-label">
            {isFamily ? t("home.strip.familyRunway") : t("home.strip.runway")}
          </span>
        </button>
      </div>
    </Card>
  );
}
