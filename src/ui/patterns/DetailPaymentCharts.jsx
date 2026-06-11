import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { useResolvedTheme } from "../../hooks/useResolvedTheme.js";
import { formatInr } from "../../constants/symbols.js";
import { ChartShell } from "./ChartShell.jsx";
import { FlexibleDataChart } from "../features/analytics/charts/FlexibleDataChart.jsx";
import { ChartTypeSelect } from "../features/analytics/charts/ChartTypeSelect.jsx";
import { Caption, Body } from "../primitives/Text.jsx";

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
    <div className="ct-stack-sm">
      <div className="ct-row-between gap-2 flex-wrap items-center">
        <Body className="ct-body-strong text-sm">{t(titleKey)}</Body>
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
        />
      </ChartShell>

      <ul className="ct-stack-sm ct-inset !p-3">
        {breakdown.map((row) => (
          <li key={row.name} className="ct-row-between gap-2">
            <Caption className="block">{row.name}</Caption>
            <Caption className="block font-semibold ct-numeral">{formatInr(row.value)}</Caption>
          </li>
        ))}
        {extraRows.map((row) => (
          <li key={row.name} className="ct-row-between gap-2">
            <Caption className="block opacity-90">{row.name}</Caption>
            <Caption className="block font-semibold">{row.value}</Caption>
          </li>
        ))}
        {total > 0 ? (
          <li className="ct-row-between gap-2 border-t border-white/10 pt-2">
            <Caption className="block font-semibold">{t(totalLabelKey)}</Caption>
            <Caption className="block font-semibold ct-numeral">{formatInr(total)}</Caption>
          </li>
        ) : null}
      </ul>

      {paymentList.length > 0 ? (
        <div className="ct-stack-sm">
          <Body className="text-xs font-semibold">{t(paymentListTitleKey)}</Body>
          <ul className="ct-stack-sm max-h-40 overflow-y-auto">
            {paymentList.slice(0, 12).map((row) => (
              <li key={`${row.date}-${row.amount}-${row.index ?? ""}`} className="ct-row-between gap-2">
                <Caption className="block">{row.date}</Caption>
                <Caption className="block font-semibold ct-numeral">{formatInr(row.amount)}</Caption>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
