import { useMemo, useState, useCallback, useRef } from "react";
import { CHART_VIEWS } from "../../../constants/plainLanguage.js";
import { useResolvedTheme } from "../../../hooks/useResolvedTheme.js";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { getChartTheme } from "../../tokens/chartTheme.js";
import { variableSpendDrilldown } from "../../../utils/analyticsSpendSeries.js";
import { Card } from "../../primitives/Card.jsx";
import { Heading, Caption } from "../../primitives/Text.jsx";
import { FlexibleDataChart } from "./charts/FlexibleDataChart.jsx";
import { ChartTypeSelect } from "./charts/ChartTypeSelect.jsx";
import VariableSpendDrilldown from "./VariableSpendDrilldown.jsx";

const VIEW_CHART_TYPES = {
  forecast: ["bar", "line"],
  payments: ["bar", "line", "pie", "donut"],
  pressure: ["line", "bar"],
};

const VIEW_DEFAULT_TYPE = {
  forecast: "bar",
  payments: "bar",
  pressure: "line",
};

const VARIABLE_SERIES = new Set(["variableLogged", "variableSpent"]);
const SWIPE_PX = 48;

export default function AnalyticsChartPanel({
  forecastSeries,
  paymentsData,
  pressureTrend,
  dailySpends = [],
}) {
  const theme = useResolvedTheme();
  const chartColors = getChartTheme(theme);
  const { t } = useTranslation();
  const [chartTypes, setChartTypes] = useState({ ...VIEW_DEFAULT_TYPE });
  const [drillMonth, setDrillMonth] = useState(/** @type {{ monthKey: string, monthLabel: string } | null} */ (null));
  const touchStartX = useRef(0);

  const views = CHART_VIEWS;
  const viewMap = useMemo(() => new Map(views.map((v) => [v.id, v])), [views]);

  const [viewId, setViewId] = useState("forecast");
  const activeId = views.some((v) => v.id === viewId) ? viewId : "forecast";
  const current = viewMap.get(activeId);
  const chartType = chartTypes[activeId] || VIEW_DEFAULT_TYPE[activeId] || "bar";
  const plotHeight = 272;
  const activeIndex = views.findIndex((v) => v.id === activeId);

  const setChartType = (type) => {
    setChartTypes((prev) => ({ ...prev, [activeId]: type }));
  };

  const goToIndex = (idx) => {
    const next = views[idx];
    if (!next) return;
    setViewId(next.id);
    setDrillMonth(null);
  };

  const onViewChange = (id) => {
    setViewId(id);
    setDrillMonth(null);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < SWIPE_PX) return;
    if (dx < 0 && activeIndex < views.length - 1) goToIndex(activeIndex + 1);
    if (dx > 0 && activeIndex > 0) goToIndex(activeIndex - 1);
  };

  const openVariableDrill = useCallback((row, seriesKey) => {
    if (!row?.monthKey) return;
    const variableAmt = Number(row.variableLogged ?? row.variableSpent) || 0;
    if (seriesKey && !VARIABLE_SERIES.has(seriesKey)) return;
    if (!seriesKey && variableAmt <= 0) return;
    setDrillMonth({ monthKey: row.monthKey, monthLabel: row.month || row.name || row.monthKey });
  }, []);

  const drilldown = useMemo(
    () => (drillMonth ? variableSpendDrilldown(dailySpends, drillMonth.monthKey) : null),
    [drillMonth, dailySpends],
  );

  const chartPayload = useMemo(() => {
    const variableBarColor = chartColors.series.warning;
    const dueColor = chartColors.series.accentSoft;
    const freeColor = chartColors.series.success;

    switch (activeId) {
      case "forecast":
        return {
          data: forecastSeries,
          xKey: "month",
          seriesKeys: [
            { key: "due", name: t("charts.recurringDue"), color: dueColor },
            { key: "variableSpent", name: t("charts.variableLogged"), color: variableBarColor },
            { key: "free", name: t("charts.likelyFree"), color: freeColor },
          ],
          clickableSeriesKeys: ["variableSpent"],
          onSeriesClick: openVariableDrill,
          emptyMessage: t("charts.emptyForecast"),
        };
      case "payments": {
        const isRound = chartType === "pie" || chartType === "donut";
        if (isRound) {
          return {
            data: paymentsData.map((r) => ({
              name: r.month,
              month: r.month,
              monthKey: r.monthKey,
              value: r.amount,
              variableLogged: r.variableLogged,
            })),
            xKey: "name",
            valueKey: "value",
            onSeriesClick: (row) => openVariableDrill(row),
            emptyMessage: t("charts.emptyPayments"),
          };
        }
        return {
          data: paymentsData,
          xKey: "month",
          seriesKeys: [
            { key: "billsPaid", name: t("charts.billsPaid"), color: dueColor },
            { key: "variableLogged", name: t("charts.variableLogged"), color: variableBarColor },
          ],
          clickableSeriesKeys: ["variableLogged"],
          onSeriesClick: openVariableDrill,
          emptyMessage: t("charts.emptyPayments"),
        };
      }
      case "pressure":
        return {
          data: pressureTrend,
          xKey: "month",
          seriesKeys: [{ key: "pressure", name: t("charts.stressScore"), color: chartColors.series.accent }],
          emptyMessage: t("charts.emptyPressure"),
          scoreChart: true,
        };
      default:
        return { data: [], emptyMessage: "" };
    }
  }, [activeId, chartType, forecastSeries, paymentsData, pressureTrend, chartColors, openVariableDrill, t]);

  const allowedTypes = VIEW_CHART_TYPES[activeId] || ["bar", "line", "pie", "donut"];
  const showTapHint = activeId === "forecast" || activeId === "payments";

  return (
    <Card className="ct-chart-single ct-stack">
      <Heading level={2}>{t("charts.title")}</Heading>

      <div className="ct-row-between items-center gap-2">
        <Caption className="font-semibold">{current?.label}</Caption>
        <div className="ct-chart-swipe-dots" role="tablist" aria-label={t("charts.swipeHint")}>
          {views.map((v, i) => (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={v.id === activeId}
              aria-label={v.label}
              className={`ct-chart-swipe-dot${v.id === activeId ? " ct-chart-swipe-dot-active" : ""}`}
              onClick={() => onViewChange(v.id)}
            />
          ))}
        </div>
      </div>

      <div className="ct-row-between" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <Caption>{showTapHint ? t("charts.tapBarHint") : t("charts.swipeHint")}</Caption>
        <ChartTypeSelect value={chartType} onChange={setChartType} allowed={allowedTypes} />
      </div>

      <div
        className="ct-chart-plot ct-chart-swipe-area"
        style={{ height: plotHeight }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <FlexibleDataChart
          data={chartPayload.data}
          chartType={chartType}
          theme={theme}
          xKey={chartPayload.xKey}
          valueKey={"valueKey" in chartPayload ? chartPayload.valueKey : undefined}
          seriesKeys={"seriesKeys" in chartPayload ? chartPayload.seriesKeys : undefined}
          onSeriesClick={"onSeriesClick" in chartPayload ? chartPayload.onSeriesClick : undefined}
          clickableSeriesKeys={"clickableSeriesKeys" in chartPayload ? chartPayload.clickableSeriesKeys : undefined}
          emptyMessage={chartPayload.emptyMessage}
          scoreChart={"scoreChart" in chartPayload ? chartPayload.scoreChart : false}
        />
      </div>

      {drillMonth && (
        <VariableSpendDrilldown
          monthLabel={drillMonth.monthLabel}
          drilldown={drilldown}
          onClose={() => setDrillMonth(null)}
        />
      )}
    </Card>
  );
}
