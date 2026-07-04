import { Heading, Caption } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
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
  embedded = false,
}) {
  const { t } = useTranslation();
  const { settings } = usePerovo();
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
    <section className={embedded ? "ed-stack" : "ed-section ed-stack"} id={embedded ? undefined : "wealth-analytics"}>
      {!embedded ? (
        <div
          style={{
            margin: "0 0 12px",
            borderRadius: 20,
            padding: "18px 18px 16px",
            border: "0.5px solid var(--pos-asset-border)",
            background: "linear-gradient(150deg,rgba(16,185,129,0.12),rgba(13,14,24,0.95) 50%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -20,
              right: -10,
              width: 100,
              height: 100,
              borderRadius: "50%",
              pointerEvents: "none",
              background: "radial-gradient(circle,rgba(16,185,129,0.2),transparent 70%)",
            }}
          />
          <div className="relative">
            <Heading level={2} className="!text-base !font-semibold">
              {t("analytics.wealth.title")}
            </Heading>
            <Caption className="block mt-1">
              {t("analytics.wealth.subtitle")}
            </Caption>
            <div className="ed-row-between items-end mt-4">
              <div>
                <p className="ed-field-label">
                  {t("netWorth.hero.eyebrow")}
                </p>
                <p
                  className="ed-numeral"
                  style={{
                    fontSize: "clamp(26px,7vw,36px)",
                    fontWeight: 700,
                    color: "#fcd34d",
                    fontVariantNumeric: "tabular-nums",
                    margin: "6px 0 2px",
                  }}
                >
                  {privacyMode ? "••••" : formatInr(intel.core?.netWorth ?? 0)}
                </p>
              </div>
              {trendChip ? <span className="ed-trend-chip">{trendChip}</span> : null}
            </div>
            {!privacyMode && sparkSeries.length > 1 ? (
              <div className="mt-3">
                <NetWorthGrowthSparkline data={sparkSeries} />
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="ed-row-between items-end">
          <div>
            <p className="ed-field-label">
              {t("netWorth.hero.eyebrow")}
            </p>
            <p
              className="ed-numeral"
              style={{
                fontSize: "clamp(22px,6vw,30px)",
                fontWeight: 700,
                color: "#fcd34d",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {privacyMode ? "••••" : formatInr(intel.core?.netWorth ?? 0)}
            </p>
          </div>
          {trendChip ? <span className="ed-trend-chip">{trendChip}</span> : null}
        </div>
      )}

      <div className={`ed-grid-2 gap-2${embedded ? "" : ""}`}>
        <div className="pos-tile asset">
          <p className="ed-field-label">{t("netWorth.chart.assets")}</p>
          <p className="ed-numeral ed-numeral">{privacyMode ? "••••" : formatInr(intel.core?.totalAssets ?? 0)}</p>
        </div>
        <div className="pos-tile liability">
          <p className="ed-field-label">{t("netWorth.chart.debt")}</p>
          <p className="ed-numeral ed-numeral">{privacyMode ? "••••" : formatInr(intel.core?.totalLiabilities ?? 0)}</p>
        </div>
      </div>

      {embedded && !privacyMode && sparkSeries.length > 1 ? (
        <NetWorthGrowthSparkline data={sparkSeries} />
      ) : null}

      {!embedded ? (
        <>
      <AllocationCharts intel={intel} privacyMode={privacyMode} />

      {ledgerSlot}

      <PhysicalAssetsSection />

      <SafetyPlannerPanel />
      <LiquidityPanel liquidity={intel.liquidity} privacyMode={privacyMode} totalAssets={intel.core?.totalAssets ?? 0} />
      <HealthScorePanel lifeScore={intel.lifeScore} />
      {benchmark?.estimatedPercentile != null && !privacyMode ? (
        <div className="ed-inset">
          <p className="ed-field-label">{t("netWorth.benchmark.title")}</p>
          <p className="ed-numeral ed-numeral">
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
        </>
      ) : null}
    </section>
  );
}
