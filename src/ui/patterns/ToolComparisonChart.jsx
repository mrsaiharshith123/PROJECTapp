import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { useResolvedTheme } from "../../hooks/useResolvedTheme.js";
import { getChartTheme } from "../tokens/chartTheme.js";
import { ChartShell } from "./ChartShell.jsx";
import { FlexibleDataChart } from "../features/analytics/charts/FlexibleDataChart.jsx";
import { ChartTypeSelect } from "../features/analytics/charts/ChartTypeSelect.jsx";
import { Caption, Body } from "../primitives/Text.jsx";

/**
 * Baseline vs what-if comparison chart for dashboard tools.
 * @param {{
 *   data: object[],
 *   titleKey: string,
 *   baselineLabelKey: string,
 *   whatIfLabelKey: string,
 *   emptyKey?: string,
 *   hintKey?: string,
 *   defaultChartType?: 'line' | 'bar',
 *   scoreChart?: boolean,
 *   extraCaption?: import('react').ReactNode,
 *   xKey?: string,
 *   baselineKey?: string,
 *   whatIfKey?: string,
 * }} props
 */
export function ToolComparisonChart({
  data,
  titleKey,
  baselineLabelKey,
  whatIfLabelKey,
  emptyKey = "charts.emptyComparison",
  hintKey = "charts.comparisonHint",
  defaultChartType = "line",
  scoreChart = false,
  extraCaption = null,
  xKey = "name",
  baselineKey = "baseline",
  whatIfKey = "whatIf",
}) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const chartColors = getChartTheme(theme);
  const [chartType, setChartType] = useState(/** @type {'line'|'bar'|'pie'|'donut'} */ (defaultChartType));

  const displayData = useMemo(
    () =>
      (data || []).map((row) => ({
        ...row,
        name: String(row[xKey] ?? "").startsWith("_") ? "" : row[xKey],
      })),
    [data, xKey],
  );

  const seriesKeys = useMemo(
    () => [
      { key: baselineKey, name: t(baselineLabelKey), color: chartColors.series.accentSoft },
      { key: whatIfKey, name: t(whatIfLabelKey), color: chartColors.series.success },
    ],
    [baselineKey, whatIfKey, baselineLabelKey, whatIfLabelKey, chartColors, t],
  );

  if (!displayData.length) {
    return <Caption className="block opacity-75">{t(emptyKey)}</Caption>;
  }

  const isTimeline = chartType === "line" || chartType === "bar";

  return (
    <div className="ct-stack-sm">
      <div className="ct-row-between gap-2 flex-wrap items-center">
        <Body className="ct-body-strong text-sm">{t(titleKey)}</Body>
        <ChartTypeSelect value={chartType} onChange={setChartType} />
      </div>

      <ChartShell hint={t(hintKey)} height={220} compact>
        <FlexibleDataChart
          data={isTimeline ? displayData : displayData.filter((r) => r.name)}
          chartType={chartType}
          theme={theme}
          xKey="name"
          seriesKeys={isTimeline ? seriesKeys : undefined}
          valueKey={baselineKey}
          valueLabel={t(baselineLabelKey)}
          emptyMessage={t(emptyKey)}
          scoreChart={scoreChart}
        />
      </ChartShell>

      {extraCaption}
    </div>
  );
}
