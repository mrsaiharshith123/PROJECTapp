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
}) {
  const t = getChartTheme(theme);
  if (!data?.length) return <ChartEmpty message={emptyMessage} />;

  const isRound = chartType === "pie" || chartType === "donut";
  if (isRound) {
    return (
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
      </ResponsiveContainer>
    );
  }

  const keys =
    seriesKeys?.length > 0
      ? seriesKeys
      : [{ key: valueKey, name: valueLabel, color: t.series.accent }];

  const Chart = chartType === "line" ? LineChart : BarChart;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <Chart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...t.grid} />
        <XAxis dataKey={xKey} tick={t.tick} axisLine={false} tickLine={false} />
        <YAxis
          domain={scoreChart ? [0, 100] : undefined}
          tick={t.tick}
          axisLine={false}
          tickLine={false}
          tickFormatter={scoreChart ? (v) => String(v) : (v) => `${INR}${v}`}
        />
        <Tooltip
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
              dot={{ r: t.dotRadius, fill: s.color || t.series.accentSoft }}
              activeDot={
                clickable
                  ? {
                      r: t.dotRadius + 2,
                      cursor: "pointer",
                      onClick: (dotProps) => {
                        const d = /** @type {{ payload?: object }} */ (dotProps);
                        const row = d.payload ?? dotProps;
                        if (row) onSeriesClick(row, s.key);
                      },
                    }
                  : { r: t.dotRadius + 2 }
              }
            />
          ) : (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color || t.series.accent}
              radius={t.barRadius}
              onClick={clickable ? (row) => onSeriesClick(row, s.key) : undefined}
              style={clickable ? { cursor: "pointer" } : undefined}
            />
          );
        })}
      </Chart>
    </ResponsiveContainer>
  );
}
