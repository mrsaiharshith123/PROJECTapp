import { useMemo, useState } from "react";
import { CHART_VIEWS, CHART_VIEWS_ADVANCED } from "../../../constants/plainLanguage.js";
import { useResolvedTheme } from "../../../hooks/useResolvedTheme.js";
import { Card } from "../../primitives/Card.jsx";
import { FilterChips } from "../../patterns/FilterChips.jsx";
import { Heading, Caption } from "../../primitives/Text.jsx";
import { Button } from "../../primitives/Button.jsx";
import {
  ForecastBarChart,
  CategoryPieChart,
  PaymentsBarChart,
  PressureLineChart,
  RecurringBarChart,
  FreeCashLineChart,
} from "./charts/AnalyticsChartViews.jsx";

export default function AnalyticsChartPanel({
  forecastSeries,
  barData,
  pieData,
  pressureTrend,
  recurringPaidTrend,
  freeCashTrend,
}) {
  const theme = useResolvedTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const mainViews = useMemo(
    () =>
      CHART_VIEWS.filter((v) => {
        if (v.id === "categories") return pieData.length > 0;
        return true;
      }),
    [pieData],
  );

  const advancedViews = useMemo(
    () =>
      CHART_VIEWS_ADVANCED.filter((v) => {
        if (v.id === "freecash") return freeCashTrend.length >= 2;
        if (v.id === "pressure") return pressureTrend.length >= 1;
        return true;
      }),
    [freeCashTrend, pressureTrend],
  );

  const chipOptions = useMemo(() => {
    const base = mainViews.map((v) => ({ id: v.id, label: v.label }));
    if (showAdvanced) {
      return [...base, ...advancedViews.map((v) => ({ id: v.id, label: v.label }))];
    }
    return base;
  }, [mainViews, advancedViews, showAdvanced]);

  const viewMap = useMemo(() => {
    const m = new Map();
    [...CHART_VIEWS, ...CHART_VIEWS_ADVANCED].forEach((v) => m.set(v.id, v));
    return m;
  }, []);

  const [viewId, setViewId] = useState("forecast");
  const activeId = chipOptions.some((o) => o.id === viewId) ? viewId : chipOptions[0]?.id || "forecast";
  const current = viewMap.get(activeId);
  const plotHeight = activeId === "categories" ? 300 : 272;

  const renderChart = () => {
    switch (activeId) {
      case "forecast":
        return <ForecastBarChart data={forecastSeries} theme={theme} />;
      case "payments":
        return <PaymentsBarChart data={barData} theme={theme} />;
      case "categories":
        return <CategoryPieChart data={pieData} theme={theme} />;
      case "pressure":
        return <PressureLineChart data={pressureTrend} theme={theme} />;
      case "recurring":
        return <RecurringBarChart data={recurringPaidTrend} theme={theme} />;
      case "freecash":
        return <FreeCashLineChart data={freeCashTrend} theme={theme} />;
      default:
        return null;
    }
  };

  return (
    <Card className="ct-chart-single ct-stack">
      <div className="ct-row-between" style={{ flexWrap: "wrap", gap: "0.5rem", alignItems: "flex-start" }}>
        <div>
          <Heading level={2}>Charts</Heading>
          <Caption className="block mt-0.5">Pick a view — one chart at a time.</Caption>
        </div>
        {advancedViews.length > 0 && (
          <Button type="button" variant="ghost" size="sm" className="!w-auto" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? "Fewer views" : "+ More views"}
          </Button>
        )}
      </div>

      <FilterChips options={chipOptions} value={activeId} onChange={setViewId} />

      {current && (
        <>
          <Caption className="font-semibold block">{current.label}</Caption>
          <Caption className="block -mt-1">{current.hint}</Caption>
        </>
      )}

      <div className="ct-chart-plot" style={{ height: plotHeight }}>
        {renderChart()}
      </div>
    </Card>
  );
}
