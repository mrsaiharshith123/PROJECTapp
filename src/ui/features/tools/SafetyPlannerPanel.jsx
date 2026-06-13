import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { Caption, Body, Heading } from "../../primitives/Text.jsx";
import { ProgressBar } from "../../patterns/ProgressBar.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../i18n/insightLabels.js";

/** Emergency readiness — auto-calculated from bills, income, and liquid assets. */
export default function SafetyPlannerPanel() {
  const { t } = useTranslation();
  const { entries } = useNetWorth();
  const stable = useStabilityIntel();
  const emergency = stable.emergency;

  const hasLiquidAssets = entries.some((e) => e.kind === "asset");

  return (
    <div className="ct-stack">
      <Caption>{t("tools.safety.introAuto")}</Caption>
      {!hasLiquidAssets && (
        <Caption className="block ct-text-warning">{t("tools.safety.addBankAsset")}</Caption>
      )}
      <div className="ct-inset ct-stack-sm">
        <Heading level={3} className="!text-base">
          {t("tools.emergency.target", {
            amount: formatInr(emergency?.recommended || 0),
            months: emergency?.recommendedMonths || 0,
          })}
        </Heading>
        <Body className="!text-sm">
          {t("tools.emergency.current", { amount: formatInr(emergency?.current || 0) })}
        </Body>
        {emergency?.gap > 0 && (
          <Caption className="block">{t("tools.emergency.gap", { amount: formatInr(emergency.gap) })}</Caption>
        )}
        <ProgressBar value={emergency?.progressPercent || 0} />
        <Body className="!text-sm font-semibold">
          {t("profileHub.widget.emergency")}: {emergency?.progressPercent ?? 0}%
        </Body>
        {emergency?.messageKey && (
          <Caption className="block">{translateInsight(t, { key: emergency.messageKey })}</Caption>
        )}
      </div>
    </div>
  );
}
