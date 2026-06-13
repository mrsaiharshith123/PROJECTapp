import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Legend, Tooltip } from "recharts";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { formatInr } from "../../constants/symbols.js";

/** @param {any} props */
function WealthTooltip({ active, payload }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload ?? {};
  const label = row.label ?? "";

  return (
    <div className="ct-chart-tooltip">
      <p className="ct-chart-tooltip-label">{label}</p>
      <p className="ct-chart-tooltip-row ct-chart-tooltip-assets">
        {t("profile.wealthChartAssets")}: {formatInr(row.assets ?? 0)}
      </p>
      <p className="ct-chart-tooltip-row ct-chart-tooltip-liabilities">
        {t("profile.wealthChartLiabilities")}: {formatInr(row.liabilities ?? 0)}
      </p>
    </div>
  );
}

/**
 * Daily assets vs liabilities — from account origin, updates on each change day.
 */
export function NetWorthGrowthSparkline({ data }) {
  const { t } = useTranslation();
  const chartData = useMemo(() => data || [], [data]);
  if (!chartData.length) return null;

  const vals = chartData.flatMap((d) => [d.assets, d.liabilities]);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals, 1);
  const span = Math.max(maxVal - minVal, maxVal * 0.08, 1);
  const yMin = 0;
  const yMax = Math.ceil(maxVal + span * 0.12);
  const showDots = chartData.length <= 16;

  return (
    <div className="ct-wealth-sparkline" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 22, right: 6, left: 2, bottom: 4 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--ct-text-muted, #94a3b8)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis domain={[yMin, yMax]} hide />
          <Tooltip content={WealthTooltip} cursor={false} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="plainline"
            iconSize={10}
            wrapperStyle={{ fontSize: "0.625rem", paddingBottom: 0, top: 0 }}
          />
          <Line
            type="linear"
            dataKey="assets"
            name={t("profile.wealthChartAssets")}
            stroke="#34d399"
            strokeWidth={2.5}
            dot={showDots ? { r: 3, fill: "#34d399" } : false}
            activeDot={{ r: 5, stroke: "#34d399", fill: "#0f172a" }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="liabilities"
            name={t("profile.wealthChartLiabilities")}
            stroke="#f87171"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={showDots ? { r: 3, fill: "#f87171" } : false}
            activeDot={{ r: 5, stroke: "#f87171", fill: "#0f172a" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
