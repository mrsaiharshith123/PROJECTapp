import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { formatInr, INR } from "../../../../constants/symbols.js";
import { getChartTheme } from "../../../tokens/chartTheme.js";
import { ChartEmpty } from "./AnalyticsChartViews.jsx";

const rupeeTip = (v) => (v != null ? formatInr(v) : "");

/** @typedef {'line' | 'bar' | 'pie' | 'donut'} ChartTypeId */

/**
 * One dataset — switch bar / line / pie / donut.
 * @param {{
 *   data: object[],
 *   chartType: ChartTypeId,
 *   theme: import('../../../tokens/chartTheme.js').ChartThemeMode,
 *   xKey?: string,
 *   valueKey?: string,
 *   valueLabel?: string,
 *   emptyMessage?: string,
 *   seriesKeys?: { key: string, name: string, color?: string }[],
 *   onSeriesClick?: (row: object, seriesKey?: string) => void,
 *   clickableSeriesKeys?: string[],
 *   scoreChart?: boolean,
 *   hideDots?: boolean,
 *   yDomainFromZero?: boolean,
 *   yDomainTight?: boolean,
 *   customTooltip?: import('react').ComponentType<any>,
 *   disableTooltipCursor?: boolean,
 * }} props
 */
export function FlexibleDataChart({
  data,
  chartType,
  theme,
  xKey = "name",
  valueKey = "value",
  valueLabel = "Amount",
  emptyMessage = "Nothing to show yet.",
  seriesKeys,
  onSeriesClick,
  clickableSeriesKeys = [],
  scoreChart = false,
  hideDots = false,
  yDomainFromZero = false,
  yDomainTight = false,
  customTooltip = undefined,
  disableTooltipCursor = false,
}) {
  const t = getChartTheme(theme);

  const keys = useMemo(
    () =>
      seriesKeys?.length > 0
        ? seriesKeys
        : [{ key: valueKey, name: valueLabel, color: t.series.accent }],
    [seriesKeys, valueKey, valueLabel, t.series.accent],
  );

  /** @type {any} */
  const yDomain = useMemo(() => {
    if (scoreChart) return [0, 100];
    if (yDomainTight) {
      const vals = (data || []).flatMap((row) => keys.map((k) => Number(row[k.key]) || 0));
      if (!vals.length) return [0, 1];
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const span = Math.max(max - min, max * 0.05, 1);
      const pad = Math.max(span * 0.06, 1);
      return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
    }
    if (yDomainFromZero) return [0, (max) => Math.max(Math.ceil(max * 1.05), 1)];
    return undefined;
  }, [data, keys, scoreChart, yDomainTight, yDomainFromZero]);

  if (!data?.length) return <ChartEmpty message={emptyMessage} />;

  const shell = (chart) => <div className="ct-chart-shell">{chart}</div>;

  const isRound = chartType === "pie" || chartType === "donut";
  if (isRound) {
    return shell(
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            innerRadius={chartType === "donut" ? 56 : 0}
            outerRadius={84}
            paddingAngle={2}
            stroke="transparent"
            onClick={onSeriesClick ? (row) => onSeriesClick(row, undefined) : undefined}
            style={onSeriesClick ? { cursor: "pointer" } : undefined}
          >
            {data.map((entry, i) => (
              <Cell key={entry[xKey] ?? i} fill={t.colors[i % t.colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => rupeeTip(v)} {...t.tooltip} />
          <Legend {...t.legend} />
        </PieChart>
      </ResponsiveContainer>,
    );
  }

  const Chart = chartType === "line" ? LineChart : BarChart;
  const showDots = !hideDots && data.length <= 12;

  return shell(
    <ResponsiveContainer width="100%" height="100%">
      <Chart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 20 }}>
        <CartesianGrid {...t.grid} />
        <XAxis
          dataKey={xKey}
          tick={t.tick}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={12}
        />
        <YAxis
          domain={yDomain}
          tick={t.tick}
          axisLine={false}
          tickLine={false}
          width={52}
          tickFormatter={scoreChart ? (v) => String(v) : (v) => `${INR}${v}`}
        />
        <Tooltip
          content={/** @type {any} */ (customTooltip)}
          cursor={disableTooltipCursor ? false : undefined}
          formatter={scoreChart ? (v) => (v != null ? String(v) : "") : (v) => rupeeTip(v)}
          {...t.tooltip}
        />
        {keys.length > 1 ? <Legend {...t.legend} /> : null}
        {keys.map((s) => {
          const clickable =
            onSeriesClick && (clickableSeriesKeys.length === 0 || clickableSeriesKeys.includes(s.key));
          return chartType === "line" ? (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color || t.series.accent}
              strokeWidth={t.lineWidth}
              animationDuration={800}
              animationEasing="ease-out"
              dot={showDots ? { r: t.dotRadius, fill: s.color || t.series.accentSoft } : false}
              activeDot={
                clickable
                  ? {
                      r: showDots ? t.dotRadius + 2 : 4,
                      cursor: "pointer",
                      onClick: (dotProps) => {
                        const d = /** @type {{ payload?: object }} */ (dotProps);
                        const row = d.payload ?? dotProps;
                        if (row) onSeriesClick(row, s.key);
                      },
                    }
                  : showDots
                    ? { r: t.dotRadius + 2 }
                    : { r: 4 }
              }
            />
          ) : (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color || t.series.accent}
              radius={t.barRadius}
              animationDuration={800}
              animationEasing="ease-out"
              onClick={clickable ? (row) => onSeriesClick(row, s.key) : undefined}
              style={clickable ? { cursor: "pointer" } : undefined}
            />
          );
        })}
      </Chart>
    </ResponsiveContainer>,
  );
}
