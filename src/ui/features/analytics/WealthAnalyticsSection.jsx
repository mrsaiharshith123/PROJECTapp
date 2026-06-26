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
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { benchmarkNetWorth } from "../../../engines/netWorthBenchmark.js";
import {
  LiquidityPanel,
  HealthScorePanel,
  PressureWealthPanel,
  AllocationCharts,
  SimulationPanel,
} from "../netWorth/NetWorthIntelligencePanels.jsx";
import { MetricOwnerLink } from "../../patterns/MetricOwnerLink.jsx";
import SafetyPlannerPanel from "../tools/SafetyPlannerPanel.jsx";
import PhysicalAssetsSection from "../netWorth/PhysicalAssetsSection.jsx";

/** Net worth intelligence — emergency readiness, liquidity, life score, pressure, allocation charts. */
export default function WealthAnalyticsSection({
  showSimulation = false,
  showPressureAsLink = false,
  ledgerSlot = null,
}) {
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const isFamily = isSalariedFamily(settings);
  const intel = useNetWorthIntel();
  const { privacyMode, dailySnapshots, entries } = useNetWorth();
  const profileScope = resolveDataProfileScope(settings);
  const income = combinedMonthlyIncome(settings);

  const benchmark = useMemo(() => {
    if (privacyMode) return null;
    return benchmarkNetWorth({
      netWorth: intel.core?.netWorth ?? 0,
      monthlyIncome: income,
      age: settings.age,
    });
  }, [privacyMode, intel.core?.netWorth, income, settings.age]);

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
      <div className="pos-hero asset ct-wealth-net-hero">
        <div className="pos-hero-glow asset" aria-hidden />
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
              <p className="pos-display-amount asset ct-numeral">{privacyMode ? "••••" : formatInr(intel.core?.netWorth ?? 0)}</p>
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
        <div className="pos-tile asset">
          <p className="ct-stat-label">{t("netWorth.chart.assets")}</p>
          <p className="ct-stat-value ct-numeral">{privacyMode ? "••••" : formatInr(intel.core?.totalAssets ?? 0)}</p>
        </div>
        <div className="pos-tile liability">
          <p className="ct-stat-label">{t("netWorth.chart.debt")}</p>
          <p className="ct-stat-value ct-numeral">{privacyMode ? "••••" : formatInr(intel.core?.totalLiabilities ?? 0)}</p>
        </div>
      </div>

      <AllocationCharts intel={intel} privacyMode={privacyMode} />

      {ledgerSlot}

      <PhysicalAssetsSection />

      <SafetyPlannerPanel />
      <LiquidityPanel liquidity={intel.liquidity} privacyMode={privacyMode} totalAssets={intel.core?.totalAssets ?? 0} />
      <HealthScorePanel lifeScore={intel.lifeScore} />
      {benchmark?.estimatedPercentile != null && !privacyMode ? (
        <div className="ct-stat-tile indigo">
          <p className="ct-stat-label">{t("netWorth.benchmark.title")}</p>
          <p className="ct-stat-value ct-numeral">
            {t("netWorth.benchmark.percentile", { pct: benchmark.estimatedPercentile })}
          </p>
          <Caption className="block mt-1">
            {t("netWorth.benchmark.peerMedian")}: {formatInr(benchmark.peerMedian ?? 0)}
          </Caption>
        </div>
      ) : null}
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
    </section>
  );
}
