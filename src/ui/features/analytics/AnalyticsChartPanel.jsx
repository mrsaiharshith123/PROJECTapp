import { useMemo, useState, useRef } from "react";
import { CHART_VIEWS } from "../../../constants/plainLanguage.js";
import { translateChartView } from "../../../i18n/domainLabels.js";
import { useResolvedTheme } from "../../../hooks/useResolvedTheme.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getChartTheme } from "../../tokens/chartTheme.js";
import { Heading, Caption } from "../../primitives/Text.jsx";
import { FlexibleDataChart } from "./charts/FlexibleDataChart.jsx";
import { ChartTypeSelect } from "./charts/ChartTypeSelect.jsx";

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

const SWIPE_PX = 48;

function seriesHasValues(rows, keys) {
  if (!rows?.length) return false;
  return rows.some((row) => keys.some((key) => Number(row[key]) > 0));
}

function pickChartView(forecastSeries, paymentsData, pressureTrend) {
  if (seriesHasValues(forecastSeries, ["due", "free"])) return "forecast";
  if (seriesHasValues(paymentsData, ["billsPaid", "amount"])) return "payments";
  if (pressureTrend?.length) return "pressure";
  return "forecast";
}

export default function AnalyticsChartPanel({ forecastSeries, paymentsData, pressureTrend }) {
  const theme = useResolvedTheme();
  const chartColors = getChartTheme(theme);
  const { t } = useTranslation();
  const [chartTypes, setChartTypes] = useState({ ...VIEW_DEFAULT_TYPE });
  const touchStartX = useRef(0);

  const views = CHART_VIEWS;

  const [viewId, setViewId] = useState(() => pickChartView(forecastSeries, paymentsData, pressureTrend));
  const activeId = views.some((v) => v.id === viewId) ? viewId : "forecast";
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
  };

  const onViewChange = (id) => {
    setViewId(id);
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

  const chartPayload = useMemo(() => {
    const dueColor = chartColors.series.accent;
    const freeColor = chartColors.series.success;
    const billsColor = chartColors.series.accentSoft;

    switch (activeId) {
      case "forecast":
        return {
          data: forecastSeries,
          xKey: "month",
          seriesKeys: [
            { key: "due", name: t("charts.recurringDue"), color: dueColor },
            { key: "free", name: t("charts.likelyFree"), color: freeColor },
          ],
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
            })),
            xKey: "name",
            valueKey: "value",
            emptyMessage: t("charts.emptyPayments"),
          };
        }
        return {
          data: paymentsData,
          xKey: "month",
          seriesKeys: [{ key: "billsPaid", name: t("charts.billsPaid"), color: billsColor }],
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
  }, [activeId, chartType, forecastSeries, paymentsData, pressureTrend, chartColors, t]);

  const allowedTypes = VIEW_CHART_TYPES[activeId] || ["bar", "line", "pie", "donut"];

  return (
    <div className="ed-chart-shell ed-stack relative">
      <div className="relative">
        <Heading level={2} className="!text-base !font-semibold">
          {t("charts.title")}
        </Heading>

        <div className="ed-row-between items-center gap-2 mt-2">
          <Caption className="font-semibold">{translateChartView(t, activeId)}</Caption>
          <div className="ed-chart-swipe-dots" role="tablist" aria-label={t("charts.swipeHint")}>
            {views.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={v.id === activeId}
                aria-label={translateChartView(t, v.id)}
                className={`ed-chart-swipe-dot${v.id === activeId ? " active" : ""}`}
                onClick={() => onViewChange(v.id)}
              />
            ))}
          </div>
        </div>

        <div className="ed-row-between mt-2" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
          <Caption>{t("charts.swipeHint")}</Caption>
          <ChartTypeSelect value={chartType} onChange={setChartType} allowed={allowedTypes} />
        </div>

        <div
          className="ed-chart-area"
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
            emptyMessage={chartPayload.emptyMessage}
            scoreChart={"scoreChart" in chartPayload ? chartPayload.scoreChart : false}
          />
        </div>
      </div>
    </div>
  );
}
