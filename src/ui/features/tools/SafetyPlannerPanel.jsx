import { useMemo } from "react";
import { computeEmergencyFundIntel } from "../../../engines/emergencyFund.js";
import { totalMonthlyBurden } from "../../../engines/burden.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { formatInr } from "../../../constants/symbols.js";
import { Caption, Body, Heading } from "../../primitives/Text.jsx";
import { ProgressBar } from "../../patterns/ProgressBar.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../i18n/insightLabels.js";

/** Emergency fund only — SIP moved to Invest & save. */
export default function SafetyPlannerPanel() {
  const { t } = useTranslation();
  const { settings, commitments, getEffectiveStatus, updateSettings } = useCommitTrack();
  const intel = useCommitIntel();
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);

  const emergency = useMemo(
    () =>
      computeEmergencyFundIntel({
        monthlyBurden: burden,
        liquidSavings: settings.liquidSavings,
        dependents: settings.dependents,
        pressureScore: intel.stability?.score ?? 50,
      }),
    [burden, settings.liquidSavings, settings.dependents, intel.stability?.score],
  );

  return (
    <div className="ct-stack">
      <Caption>{t("tools.safety.intro")}</Caption>
      <div>
        <label className="ct-metric-label block">{t("tools.emergency.liquidSavings")}</label>
        <input
          className="ct-input mt-1"
          value={settings.liquidSavings === 0 ? "" : String(settings.liquidSavings)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, "");
            updateSettings({ liquidSavings: raw === "" ? 0 : Math.max(0, Number(raw) || 0) });
          }}
          inputMode="numeric"
        />
      </div>
      <div className="ct-inset ct-stack-sm">
        <Heading level={3} className="!text-base">
          {t("tools.emergency.target", {
            amount: formatInr(emergency.recommended),
            months: emergency.recommendedMonths,
          })}
        </Heading>
        <Body className="!text-sm">
          {t("tools.emergency.current", { amount: formatInr(emergency.current) })}
        </Body>
        {emergency.gap > 0 && (
          <Caption className="block">{t("tools.emergency.gap", { amount: formatInr(emergency.gap) })}</Caption>
        )}
        <ProgressBar value={emergency.progressPercent} />
        <Caption className="block">{translateInsight(t, { key: emergency.messageKey })}</Caption>
      </div>
    </div>
  );
}
