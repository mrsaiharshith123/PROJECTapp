import { ResponsiveContainer, LineChart, Line, YAxis, XAxis, Tooltip } from "recharts";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { formatInr } from "../../constants/symbols.js";
import { salarySpendBarColor } from "../../utils/salarySpendBar.js";

/** @param {any} props */
function SpendTooltip({ active, payload, household = false }) {
  const { t } = useTranslation();
  if (!active || !payload?.[0]) return null;

  const row = payload[0].payload ?? {};
  const label = row.label ?? "";

  return (
    <div className="ct-chart-tooltip">
      <p className="ct-chart-tooltip-label">{label}</p>
      <p className="ct-chart-tooltip-row">
        {t(household ? "home.sparklineUsedHousehold" : "home.sparklineUsed")}: {formatInr(payload[0].value ?? 0)}
      </p>
    </div>
  );
}

function spendYMax(data) {
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 0);
  const headroom = Math.max(maxValue * 0.18, 1500, maxValue > 0 ? maxValue * 0.08 : 0);
  return Math.ceil(Math.max(maxValue + headroom, maxValue || 1));
}

/**
 * Small bottom sparkline — cumulative spend through the month (tight scale for visible movement).
 * @param {{ data: { day: number, label?: string, value: number }[], salary: number, spendPct: number, overBudget?: boolean, household?: boolean }} props
 */
export function MonthlySpendSparkline({ data, salary: _salary, spendPct, overBudget = false, household = false }) {
  const color =
    overBudget || spendPct >= 100 ? "#ef4444" : salarySpendBarColor(spendPct);
  if (!data?.length) return null;

  const yMax = spendYMax(data);

  return (
    <div className="ct-hero-spend-chart" aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 4, left: 2, bottom: 14 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--ct-text-muted, #94a3b8)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis domain={[0, yMax]} hide />
          <Tooltip content={(props) => <SpendTooltip {...props} household={household} />} cursor={false} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, stroke: color, fill: "#0f172a" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
