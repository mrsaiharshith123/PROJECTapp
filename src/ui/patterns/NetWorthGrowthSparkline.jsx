import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, Area, YAxis, XAxis, Legend, Tooltip, CartesianGrid } from "recharts";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { formatInr } from "../../constants/symbols.js";

const ASSET_COLOR = "#2dd4bf";
const LIABILITY_COLOR = "#f87171";
const DOT_FILL = "#0d0e18";

/** @param {any} props */
function WealthTooltip({ active, payload }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload ?? {};
  const label = row.label ?? "";

  return (
    <div className="ed-inset">
      <p className="ed-field-label">{label}</p>
      <p className="ed-caption">
        {t("profile.wealthChartAssets")}: {formatInr(row.assets ?? 0)}
      </p>
      <p className="ed-caption">
        {t("profile.wealthChartLiabilities")}: {formatInr(row.liabilities ?? 0)}
      </p>
    </div>
  );
}

/** @param {any} props */
function GlowingActiveDot({ cx, cy, stroke }) {
  if (cx == null || cy == null) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={7} fill={stroke} opacity={0.25} />
      <circle cx={cx} cy={cy} r={4} stroke={stroke} strokeWidth={2} fill={DOT_FILL} />
    </g>
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
    <div className="ed-chart-area" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 22, right: 6, left: 2, bottom: 4 }}>
          <defs>
            <linearGradient id="nw-assets-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ASSET_COLOR} stopOpacity={0.18} />
              <stop offset="100%" stopColor={ASSET_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--ed-muted-text)" }}
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
          <Area
            type="linear"
            dataKey="assets"
            stroke="none"
            fill="url(#nw-assets-area)"
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Line
            type="linear"
            dataKey="assets"
            name={t("profile.wealthChartAssets")}
            stroke={ASSET_COLOR}
            strokeWidth={2.5}
            dot={showDots ? { r: 3, fill: ASSET_COLOR } : false}
            activeDot={(props) => <GlowingActiveDot {...props} stroke={ASSET_COLOR} />}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Line
            type="linear"
            dataKey="liabilities"
            name={t("profile.wealthChartLiabilities")}
            stroke={LIABILITY_COLOR}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={showDots ? { r: 3, fill: LIABILITY_COLOR } : false}
            activeDot={(props) => <GlowingActiveDot {...props} stroke={LIABILITY_COLOR} />}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
