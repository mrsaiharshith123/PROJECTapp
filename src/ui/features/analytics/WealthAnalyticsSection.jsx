import { Heading, Caption } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { useNetWorthIntel } from "../../../hooks/useNetWorthIntel.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { NetWorthGrowthSparkline } from "../../patterns/NetWorthGrowthSparkline.jsx";
import { buildWealthDailySeries } from "../../../utils/wealthDailySeries.js";
import { resolveDataProfileScope } from "../../../constants/modeExperience.js";
import { useMemo } from "react";
import {
  LiquidityPanel,
  HealthScorePanel,
  PressureWealthPanel,
  AllocationCharts,
  SimulationPanel,
} from "../netWorth/NetWorthIntelligencePanels.jsx";
import { MetricOwnerLink } from "../../patterns/MetricOwnerLink.jsx";
import SafetyPlannerPanel from "../tools/SafetyPlannerPanel.jsx";

/** Net worth intelligence — emergency readiness, liquidity, life score, pressure, allocation charts. */
export default function WealthAnalyticsSection({
  showSimulation = false,
  showPressureAsLink = false,
}) {
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const isFamily = isSalariedFamily(settings);
  const intel = useNetWorthIntel();
  const { privacyMode, dailySnapshots, entries } = useNetWorth();
  const profileScope = resolveDataProfileScope(settings);

  const sparkSeries = useMemo(
    () =>
      buildWealthDailySeries(
        dailySnapshots,
        entries,
        profileScope,
        intel.core?.totalAssets ?? 0,
        intel.core?.totalLiabilities ?? 0,
        settings.accountCreatedAt || 0,
      ),
    [
      dailySnapshots,
      entries,
      profileScope,
      settings.accountCreatedAt,
      intel.core?.totalAssets,
      intel.core?.totalLiabilities,
    ],
  );

  const monthly = intel.growth?.monthlyPct;
  const trendChip =
    monthly != null && !privacyMode
      ? `${monthly >= 0 ? "+" : ""}${monthly.toFixed(1)}%`
      : null;

  return (
    <section className="ct-analytics-section ct-stack" id="wealth-analytics">
      <div className="ct-hero-card wealth ct-wealth-net-hero">
        <div className="ct-hero-glow teal" aria-hidden />
        <div className="relative">
          <Heading level={2} className="!text-base !font-semibold">
            {isFamily ? t("analytics.wealth.titleHousehold") : t("analytics.wealth.title")}
          </Heading>
          <Caption className="block mt-1">
            {isFamily ? t("analytics.wealth.subtitleHousehold") : t("analytics.wealth.subtitle")}
          </Caption>
          <div className="ct-row-between items-end mt-4">
            <div>
              <p className="ct-hero-label">
                {isFamily ? t("netWorth.hero.eyebrowHousehold") : t("netWorth.hero.eyebrow")}
              </p>
              <p className="ct-hero-number ct-numeral">{privacyMode ? "••••" : formatInr(intel.core?.netWorth ?? 0)}</p>
            </div>
            {trendChip ? <span className="ct-trend-chip">{trendChip}</span> : null}
          </div>
          {!privacyMode && sparkSeries.length > 1 ? (
            <div className="mt-3">
              <NetWorthGrowthSparkline data={sparkSeries} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="ct-grid-2 gap-2">
        <div className="ct-stat-tile teal">
          <p className="ct-stat-label">{t("netWorth.chart.assets")}</p>
          <p className="ct-stat-value ct-numeral">{privacyMode ? "••••" : formatInr(intel.core?.totalAssets ?? 0)}</p>
        </div>
        <div className="ct-stat-tile danger">
          <p className="ct-stat-label">{t("netWorth.chart.debt")}</p>
          <p className="ct-stat-value ct-numeral">{privacyMode ? "••••" : formatInr(intel.core?.totalLiabilities ?? 0)}</p>
        </div>
      </div>

      <SafetyPlannerPanel />
      <LiquidityPanel liquidity={intel.liquidity} privacyMode={privacyMode} totalAssets={intel.core?.totalAssets ?? 0} />
      <HealthScorePanel lifeScore={intel.lifeScore} />
      {showPressureAsLink ? (
        <MetricOwnerLink
          label={t("perovoScore.title")}
          value={privacyMode ? undefined : String(intel.pressure?.score ?? "")}
          to="/"
        />
      ) : (
        <PressureWealthPanel pressure={intel.pressure} cashFlow={intel.cashFlow} privacyMode={privacyMode} />
      )}
      {showSimulation ? <SimulationPanel simulationBase={intel.simulationBase} /> : null}
      <AllocationCharts intel={intel} privacyMode={privacyMode} />
    </section>
  );
}
