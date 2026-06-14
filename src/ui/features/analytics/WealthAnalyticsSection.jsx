import { Heading, Caption } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { useNetWorthIntel } from "../../../hooks/useNetWorthIntel.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import {
  LiquidityPanel,
  HealthScorePanel,
  PressureWealthPanel,
  AllocationCharts,
} from "../netWorth/NetWorthIntelligencePanels.jsx";
import SafetyPlannerPanel from "../tools/SafetyPlannerPanel.jsx";

/** Net worth intelligence — emergency readiness, liquidity, life score, pressure, allocation charts. */
export default function WealthAnalyticsSection() {
  const { t } = useTranslation();
  const { settings } = useCommitTrack();
  const isFamily = isSalariedFamily(settings);
  const intel = useNetWorthIntel();
  const { privacyMode } = useNetWorth();

  return (
    <section className="ct-analytics-section ct-stack" id="wealth-analytics">
      <div>
        <Heading level={2}>
          {isFamily ? t("analytics.wealth.titleHousehold") : t("analytics.wealth.title")}
        </Heading>
        <Caption className="block mt-1">
          {isFamily ? t("analytics.wealth.subtitleHousehold") : t("analytics.wealth.subtitle")}
        </Caption>
      </div>
      <SafetyPlannerPanel />
      <LiquidityPanel liquidity={intel.liquidity} privacyMode={privacyMode} />
      <HealthScorePanel lifeScore={intel.lifeScore} />
      <PressureWealthPanel pressure={intel.pressure} cashFlow={intel.cashFlow} privacyMode={privacyMode} />
      <AllocationCharts intel={intel} privacyMode={privacyMode} />
    </section>
  );
}
