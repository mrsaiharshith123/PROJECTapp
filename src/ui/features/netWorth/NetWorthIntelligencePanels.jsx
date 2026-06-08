import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Card, Caption, Body, Heading, InfoTip } from "../../index.js";
import { FlexibleDataChart } from "../analytics/charts/FlexibleDataChart.jsx";
import { useResolvedTheme } from "../../../hooks/useResolvedTheme.js";
import { runWealthSimulation } from "../../../engines/netWorth/simulation.js";
import { getApplicableWealthScenarios } from "../../../engines/scenarioCatalog.js";
import { useMemo, useState } from "react";

export function LiquidityPanel({ liquidity, privacyMode }) {
  const { t } = useTranslation();
  return (
    <Card className="ct-nw-panel ct-animate-fade-up">
      <div className="ct-row-between">
        <Heading level={3}>{t("netWorth.liquidity.title")}</Heading>
        <InfoTip text={t("netWorth.liquidity.tip")} />
      </div>
      <div className="ct-nw-stat mt-3">
        <Caption>{t("netWorth.liquidity.survival")}</Caption>
        <Body className="ct-numeral font-bold">
          {t("netWorth.liquidity.months", { count: liquidity.survivalMonths })}
        </Body>
      </div>
      <Caption className="mt-3 block">
        {t(`netWorth.liquidity.strength.${liquidity.emergencyLiquidityStrength}`)}
      </Caption>
      {!privacyMode && liquidity.lockedWealthPct > 40 && (
        <Caption className="mt-2 block text-[var(--ct-warning)]">
          {t("netWorth.insight.lockedWealth", { pct: liquidity.lockedWealthPct })}
        </Caption>
      )}
    </Card>
  );
}

export function HealthScorePanel({ lifeScore }) {
  const { t } = useTranslation();
  const pct = lifeScore.score;
  return (
    <Card className="ct-nw-panel ct-animate-fade-up">
      <Heading level={3}>{t("netWorth.lifeScore.title")}</Heading>
      <div
        className="ct-nw-score-ring mt-3"
        style={/** @type {import('react').CSSProperties} */ ({ "--nw-score": pct })}
      >
        <span className="ct-nw-score-value ct-numeral">{pct}</span>
      </div>
      <Body className="text-center mt-2 font-semibold">{t(lifeScore.labelKey)}</Body>
      {lifeScore.actionKeys?.length > 0 && (
        <ul className="ct-stack-sm mt-4 text-sm">
          {lifeScore.actionKeys.map((key) => (
            <li key={key}>→ {t(key)}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function PressureWealthPanel({ pressure, cashFlow, privacyMode }) {
  const { t } = useTranslation();
  return (
    <Card className="ct-nw-panel ct-animate-fade-up">
      <Heading level={3}>{t("netWorth.pressure.title")}</Heading>
      <Body className="mt-2">{t(pressure.postureKey)}</Body>
      <div className="ct-nw-stat mt-3">
        <Caption>{t("netWorth.cashFlow.breathing")}</Caption>
        <Body className="ct-numeral font-bold">
          {privacyMode ? "••••" : formatInr(cashFlow.leftoverCash)}
        </Body>
      </div>
      {pressure.narrativeKeys.map((n) => (
        <Caption key={n.key} className="mt-2 block">
          {t(n.key, n.params)}
        </Caption>
      ))}
    </Card>
  );
}

export function AllocationCharts({ intel, privacyMode }) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  if (privacyMode) return null;

  const assetData = intel.core.assetAllocation.slice(0, 6).map((a) => ({
    name: a.name,
    value: a.value,
  }));
  const debtData = [
    { name: t("netWorth.chart.assets"), value: intel.core.totalAssets },
    { name: t("netWorth.chart.debt"), value: intel.core.totalLiabilities },
  ];

  return (
    <div className="ct-stack">
      {assetData.length > 0 && (
        <Card className="ct-nw-panel">
          <Heading level={3}>{t("netWorth.chart.allocation")}</Heading>
          <FlexibleDataChart
            data={assetData}
            chartType="donut"
            theme={theme}
            emptyMessage=""
          />
        </Card>
      )}
      <Card className="ct-nw-panel">
        <Heading level={3}>{t("netWorth.chart.debtRatio")}</Heading>
        <FlexibleDataChart
          data={debtData}
          chartType="bar"
          theme={theme}
          emptyMessage=""
        />
      </Card>
    </div>
  );
}

export function SimulationPanel({ simulationBase }) {
  const { t } = useTranslation();
  const scenarios = useMemo(
    () => getApplicableWealthScenarios(simulationBase || {}),
    [simulationBase],
  );
  const [activeId, setActiveId] = useState(() => scenarios[0]?.id || "");
  const scenario = scenarios.find((s) => s.id === activeId) || scenarios[0];
  const result = scenario ? runWealthSimulation(simulationBase, scenario) : null;

  if (!scenarios.length) {
    return (
      <Card className="ct-nw-panel">
        <Caption>{t("tools.planner.scenariosEmpty")}</Caption>
      </Card>
    );
  }

  return (
    <Card className="ct-nw-panel">
      <Heading level={3}>{t("netWorth.sim.title")}</Heading>
      <Caption className="mt-1 block">{t("netWorth.sim.subtitle")}</Caption>
      <div className="ct-row flex-wrap gap-2 mt-3">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`ct-chip ${activeId === s.id ? "ct-chip-active" : ""}`}
            onClick={() => setActiveId(s.id)}
          >
            {t(s.labelKey)}
          </button>
        ))}
      </div>
      {result && (
      <div className="ct-nw-sim-result mt-4">
        <div className="ct-grid-2 gap-3">
          <div>
            <Caption>{t("netWorth.sim.projectedNw")}</Caption>
            <Body className="ct-numeral font-bold">{formatInr(result.projectedNetWorth)}</Body>
          </div>
          <div>
            <Caption>{t("netWorth.sim.delta")}</Caption>
            <Body className={`ct-numeral font-bold ${result.deltaNetWorth >= 0 ? "text-emerald-500" : "text-red-400"}`}>
              {result.deltaNetWorth >= 0 ? "+" : ""}
              {formatInr(result.deltaNetWorth)}
            </Body>
          </div>
          <div>
            <Caption>{t("netWorth.sim.survival")}</Caption>
            <Body className="font-bold">
              {t("netWorth.liquidity.months", { count: result.survivabilityMonths })}
            </Body>
          </div>
          <div>
            <Caption>{t("netWorth.sim.stability")}</Caption>
            <Body className="font-bold">{t(result.stabilityKey)}</Body>
          </div>
        </div>
      </div>
      )}
    </Card>
  );
}
