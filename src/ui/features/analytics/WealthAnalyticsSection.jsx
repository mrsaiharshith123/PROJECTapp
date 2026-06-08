import { Heading, Caption } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorthIntel } from "../../../hooks/useNetWorthIntel.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import {
  LiquidityPanel,
  HealthScorePanel,
  PressureWealthPanel,
  AllocationCharts,
} from "../netWorth/NetWorthIntelligencePanels.jsx";

/** Net worth intelligence — liquidity, life score, pressure, allocation charts. */
export default function WealthAnalyticsSection() {
  const { t } = useTranslation();
  const intel = useNetWorthIntel();
  const { privacyMode } = useNetWorth();

  return (
    <section className="ct-analytics-section ct-stack" id="wealth-analytics">
      <div>
        <Heading level={2}>{t("analytics.wealth.title")}</Heading>
        <Caption className="block mt-1">{t("analytics.wealth.subtitle")}</Caption>
      </div>
      <LiquidityPanel liquidity={intel.liquidity} privacyMode={privacyMode} />
      <HealthScorePanel lifeScore={intel.lifeScore} />
      <PressureWealthPanel pressure={intel.pressure} cashFlow={intel.cashFlow} privacyMode={privacyMode} />
      <AllocationCharts intel={intel} privacyMode={privacyMode} />
    </section>
  );
}
