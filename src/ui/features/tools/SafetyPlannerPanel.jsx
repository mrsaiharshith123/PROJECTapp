import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { Caption } from "../../primitives/Text.jsx";
import { ProgressBar } from "../../patterns/ProgressBar.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../i18n/insightLabels.js";

/** Emergency readiness — auto-calculated from bills, income, and liquid assets. */
export default function SafetyPlannerPanel() {
  const { t } = useTranslation();
  const { entries } = useNetWorth();
  const stable = useStabilityIntel();
  const emergency = stable.emergency;

  const hasLiquidAssets = entries.some((e) => e.kind === "asset");
  const fundedPct = emergency?.progressPercent ?? 0;

  return (
    <div className="ed-stack">
      <ToolAnswerHero
        tone="survival"
        label={t("tools.safety.heroLabel")}
        value={formatInr(emergency?.recommended || 0)}
        subtitle={t("tools.safety.heroSubtitle", { percent: fundedPct })}
      />
      <Caption>{t("tools.safety.introAuto")}</Caption>
      {!hasLiquidAssets && (
        <Caption className="block ed-field-note">{t("tools.safety.addBankAsset")}</Caption>
      )}
      <div className="ed-grid-2">
        <div className="ed-inset-green">
          <p className="ed-stat-value text-sm">{t("tools.emergency.current", { amount: formatInr(emergency?.current || 0) })}</p>
        </div>
        {emergency?.gap > 0 ? (
          <div className="ed-inset-amber">
            <p className="ed-stat-value text-sm">{t("tools.emergency.gap", { amount: formatInr(emergency.gap) })}</p>
          </div>
        ) : null}
      </div>
      <ProgressBar value={fundedPct} />
      {emergency?.messageKey && (
        <div className="ed-inset">
          <p className="ed-stat-value text-sm">{translateInsight(t, { key: emergency.messageKey })}</p>
        </div>
      )}
      <div className="ed-inset">
        <p className="ed-stat-label">{t("tools.safety.disclaimer")}</p>
      </div>
    </div>
  );
}
