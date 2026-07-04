import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { useResolvedTheme } from "../../hooks/useResolvedTheme.js";
import { formatInr } from "../../constants/symbols.js";
import { ChartShell } from "./ChartShell.jsx";
import { FlexibleDataChart } from "../features/analytics/charts/FlexibleDataChart.jsx";
import { ChartTypeSelect } from "../features/analytics/charts/ChartTypeSelect.jsx";
import { Caption, Body } from "../primitives/Text.jsx";
import { cn } from "../utils/cn.js";

const BREAKDOWN_SEGMENT_COLORS = ["var(--ed-green)", "var(--ed-amber)"];

/**
 * Shared chart block for bill / lending detail — one graph + one summary list (no duplicate stat grid).
 * @param {{
 *   breakdown: { name: string, value: number }[],
 *   timeline: { name: string, value: number }[],
 *   paymentList: { date: string, amount: number, index?: number }[],
 *   extraRows?: { name: string, value: string }[],
 *   titleKey: string,
 *   splitTitleKey: string,
 *   timelineTitleKey: string,
 *   emptyKey: string,
 *   totalLabelKey: string,
 *   paymentListTitleKey: string,
 *   heroVariant?: string,
 * }} props
 */
export function DetailPaymentCharts({
  breakdown,
  timeline,
  paymentList,
  extraRows = [],
  titleKey,
  splitTitleKey,
  timelineTitleKey,
  emptyKey,
  totalLabelKey,
  paymentListTitleKey,
  heroVariant = "lending",
}) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const [chartType, setChartType] = useState(/** @type {'line'|'bar'|'pie'|'donut'} */ ("donut"));

  const hasData = breakdown.length > 0 || timeline.length > 0;
  const isTimeline = chartType === "line" || chartType === "bar";
  const chartData = useMemo(
    () => (isTimeline && timeline.length > 0 ? timeline : breakdown),
    [isTimeline, timeline, breakdown],
  );

  const total = useMemo(
    () => breakdown.reduce((s, r) => s + (Number(r.value) || 0), 0),
    [breakdown],
  );

  if (!hasData) {
    return <Caption className="block opacity-75">{t(emptyKey)}</Caption>;
  }

  return (
    <div className={cn("ed-inset", heroVariant, "ed-stack-sm")}>
      <div className="ed-row-between gap-2 flex-wrap items-center relative">
        <Body className="ed-body-strong text-sm">{t(titleKey)}</Body>
        <ChartTypeSelect value={chartType} onChange={setChartType} />
      </div>

      <ChartShell
        title={isTimeline && timeline.length > 0 ? t(timelineTitleKey) : t(splitTitleKey)}
        hint={t("charts.sameDataHint")}
        height={220}
        compact
      >
        <FlexibleDataChart
          data={chartData}
          chartType={chartType}
          theme={theme}
          valueKey="value"
          xKey="name"
          valueLabel={t("charts.paid")}
          emptyMessage={t(emptyKey)}
          segmentColors={BREAKDOWN_SEGMENT_COLORS}
        />
      </ChartShell>

      <ul className="ed-stack-sm">
        {breakdown.map((row, index) => (
          <li key={row.name} className={cn("ed-inset ed-row-between gap-2 items-center", index === 0 ? "teal" : "amber")}>
            <Caption className="block ed-stat-label !text-xs">{row.name}</Caption>
            <Caption className="block font-semibold ed-numeral ed-stat-value !text-sm">{formatInr(row.value)}</Caption>
          </li>
        ))}
        {extraRows.map((row) => (
          <li key={row.name} className="ed-inset ed-row-between gap-2 items-center">
            <Caption className="block ed-stat-label !text-xs">{row.name}</Caption>
            <Caption className="block font-semibold ed-stat-value !text-sm">{row.value}</Caption>
          </li>
        ))}
        {total > 0 ? (
          <li className="ed-inset ed-row-between gap-2 items-center border-t border-[var(--ed-rule)] pt-2">
            <Caption className="block font-semibold ed-stat-label !text-xs">{t(totalLabelKey)}</Caption>
            <Caption className="block font-semibold ed-numeral ed-stat-value !text-sm">{formatInr(total)}</Caption>
          </li>
        ) : null}
      </ul>

      {paymentList.length > 0 ? (
        <div className="ed-stack-sm">
          <Body className="text-xs font-semibold">{t(paymentListTitleKey)}</Body>
          <ul className="ed-stack-sm max-h-40 overflow-y-auto">
            {paymentList.slice(0, 12).map((row) => (
              <li key={`${row.date}-${row.amount}-${row.index ?? ""}`} className="ed-settings-row ed-settings-row ed-settings-row-static">
                <span className="ed-settings-row-label">{row.date}</span>
                <span className="ed-settings-row-value ed-numeral font-semibold">{formatInr(row.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
