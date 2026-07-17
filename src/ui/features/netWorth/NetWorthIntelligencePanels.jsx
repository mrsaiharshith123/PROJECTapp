import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Card, Caption, Body, Heading, InfoTip } from "../../index.js";
import { FlexibleDataChart } from "../analytics/charts/FlexibleDataChart.jsx";
import { useResolvedTheme } from "../../../hooks/useResolvedTheme.js";
import { runWealthSimulation } from "../../../engines/netWorth/simulation.js";
import { getApplicableWealthScenarios } from "../../../engines/scenarioCatalog.js";
import { useMemo, useState } from "react";

export function LiquidityPanel({ liquidity, privacyMode, totalAssets = 0 }) {
  const { t } = useTranslation();
  const cash = liquidity.pureLiquid || 0;
  const invest = (liquidity.semiLiquid || 0) + (liquidity.highRisk || 0);
  const locked = Math.max(0, (totalAssets || 0) - cash - invest);
  const sum = cash + invest + locked || 1;
  const cashPct = (cash / sum) * 100;
  const investPct = (invest / sum) * 100;
  const lockedPct = (locked / sum) * 100;

  return (
    <Card className="ed-inset">
      <div className="ed-row-between">
        <Heading level={3}>{t("netWorth.liquidity.title")}</Heading>
        <InfoTip text={t("netWorth.liquidity.tip")} />
      </div>
      <div className="ed-inset mt-3">
        <Caption>{t("netWorth.liquidity.survival")}</Caption>
        <Body className="ed-numeral font-bold">
          {t("netWorth.liquidity.months", { count: liquidity.survivalMonths })}
        </Body>
      </div>
      {!privacyMode && totalAssets > 0 ? (
        <>
          <div className="ed-liquidity-bar" aria-hidden>
            <span className="ed-liquidity-cash" style={{ width: `${cashPct}%` }} />
            <span className="ed-liquidity-invest" style={{ width: `${investPct}%` }} />
            <span className="ed-liquidity-locked" style={{ width: `${lockedPct}%` }} />
          </div>
          <div className="ed-grid-3 gap-2 mt-2">
            <div className="ed-inset-green">
              <p className="ed-stat-label">{t("netWorth.liquidity.cash")}</p>
              <p className="ed-stat-value text-sm">{formatInr(cash)}</p>
            </div>
            <div className="ed-inset">
              <p className="ed-stat-label">{t("netWorth.liquidity.investments")}</p>
              <p className="ed-stat-value text-sm">{formatInr(invest)}</p>
            </div>
            <div className="ed-inset-amber">
              <p className="ed-stat-label">{t("netWorth.liquidity.locked")}</p>
              <p className="ed-stat-value text-sm">{formatInr(locked)}</p>
            </div>
          </div>
        </>
      ) : null}
      <Caption className="mt-3 block">
        {t(`netWorth.liquidity.strength.${liquidity.emergencyLiquidityStrength}`)}
      </Caption>
      {!privacyMode && liquidity.lockedWealthPct > 40 && (
        <Caption className="mt-2 block text-[var(--ed-amber)]">
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
    <Card className="ed-inset">
      <Heading level={3}>{t("netWorth.lifeScore.title")}</Heading>
      <div
        className="ed-conic-ring mt-3"
        style={/** @type {import('react').CSSProperties} */ ({ "--nw-score": pct })}
      >
        <span className="ed-numeral ed-numeral">{pct}</span>
      </div>
      <Body className="text-center mt-2 font-semibold">{t(lifeScore.labelKey)}</Body>
      {lifeScore.actionKeys?.length > 0 && (
        <ul className="ed-stack-sm mt-4 text-sm">
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
    <Card className="ed-inset">
      <Heading level={3}>{t("netWorth.pressure.title")}</Heading>
      <Body className="mt-2">{t(pressure.postureKey)}</Body>
      <div className="ed-inset mt-3">
        <Caption>{t("netWorth.cashFlow.breathing")}</Caption>
        <Body className="ed-numeral font-bold">
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

export function AllocationCharts({ intel, privacyMode, variant = "all" }) {
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

  const showAssets = variant === "all" || variant === "assets";
  const showDebt = variant === "all" || variant === "liabilities";

  return (
    <div className="ed-stack">
      {showAssets && assetData.length > 0 && (
        <Card className="ed-inset">
          <Heading level={3}>{t("netWorth.chart.allocation")}</Heading>
          <div className="ed-chart-area" style={{ height: 220 }}>
            <FlexibleDataChart
              data={assetData}
              chartType="donut"
              theme={theme}
              emptyMessage=""
            />
          </div>
        </Card>
      )}
      {showDebt && (
      <Card className="ed-inset">
        <Heading level={3}>{t("netWorth.chart.debtRatio")}</Heading>
        <div className="ed-chart-area" style={{ height: 220 }}>
          <FlexibleDataChart
            data={debtData}
            chartType="bar"
            theme={theme}
            emptyMessage=""
          />
        </div>
      </Card>
      )}
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
  const maxDelta = useMemo(
    () => Math.max(...scenarios.map((s) => Math.abs(runWealthSimulation(simulationBase, s)?.deltaNetWorth || 0)), 1),
    [scenarios, simulationBase],
  );

  if (!scenarios.length) {
    return (
      <Card className="ed-inset">
        <Caption>{t("tools.planner.scenariosEmpty")}</Caption>
      </Card>
    );
  }

  const projected = result?.projectedNetWorth ?? 0;

  return (
    <div className="ed-stack">
      <div className="ed-math-calc-display-wrap">
<p className="ed-kicker">{t("netWorth.sim.title")}</p>
        <p className="ed-hero-number">{formatInr(projected)}</p>
        <Caption className="block relative mt-1">{t("netWorth.sim.subtitle")}</Caption>
      </div>
      {scenarios.map((s) => {
        const sim = runWealthSimulation(simulationBase, s);
        const delta = sim?.deltaNetWorth ?? 0;
        const impactPct = Math.min(100, Math.round((Math.abs(delta) / maxDelta) * 100));
        const active = activeId === s.id;
        return (
          <button
            key={s.id}
            type="button"
            className={`ed-plan-goal-card w-full text-left ${active ? "active" : ""}`}
            onClick={() => setActiveId(s.id)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--ed-ink)]">{t(s.labelKey)}</p>
              <p
                className="text-xs ed-numeral mt-0.5"
                style={{ color: delta >= 0 ? "var(--ed-green)" : "var(--ed-red)" }}
              >
                {delta >= 0 ? "+" : ""}
                {formatInr(delta)}
              </p>
              <div className="ed-progress-track">
                <div
                  className={`ed-progress-bar ${delta >= 0 ? "positive" : "negative"}`}
                  style={{ width: `${impactPct}%` }}
                />
              </div>
            </div>
            {active && result ? (
              <div className="text-right shrink-0">
                <Caption>{t("netWorth.sim.projectedNw")}</Caption>
                <Body className="ed-numeral font-bold text-sm">{formatInr(result.projectedNetWorth)}</Body>
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
