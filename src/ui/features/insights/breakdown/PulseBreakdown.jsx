import { useTranslation } from "../../../../i18n/I18nProvider.js";
import FinancialPulseCard from "../../home/FinancialPulseCard.jsx";
import { InsightsBreakdownShell } from "./_shared.jsx";

export default function InsightsPulseBreakdownPage() {
  const { t } = useTranslation();

  return (
    <InsightsBreakdownShell
      title={t("analytics.insightCard.pulse")}
      subtitle={t("insights.subpages.pulseSubtitle")}
    >
      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <FinancialPulseCard />
      </div>
    </InsightsBreakdownShell>
  );
}

/** @route /insights/assets */
