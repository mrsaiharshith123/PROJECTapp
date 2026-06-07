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
import { Caption } from "../../../primitives/Text.jsx";

const rupeeTip = (v) => (v != null ? formatInr(v) : "");

export function ChartEmpty({ message = "Nothing to show yet." }) {
  return (
    <div className="ct-chart-empty">
      <Caption>{message}</Caption>
    </div>
  );
}

/** @param {{ data: object[], theme: import('../../../tokens/chartTheme.js').ChartThemeMode }} props */
export function ForecastBarChart({ data, theme }) {
  const t = getChartTheme(theme);
  if (!data?.length) return <ChartEmpty message="Add bills to see your outlook." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...t.grid} />
        <XAxis dataKey="month" tick={t.tick} axisLine={false} tickLine={false} />
        <YAxis tick={t.tick} axisLine={false} tickLine={false} tickFormatter={(v) => `${INR}${v}`} />
        <Tooltip formatter={(v) => rupeeTip(v)} {...t.tooltip} />
        <Legend {...t.legend} />
        <Bar dataKey="due" name="Still due" fill={t.series.warning} radius={t.barRadius} />
        <Bar dataKey="free" name="Likely free" fill={t.series.success} radius={t.barRadius} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** @param {{ data: object[], theme: import('../../../tokens/chartTheme.js').ChartThemeMode }} props */
export function PaymentsBarChart({ data, theme }) {
  const t = getChartTheme(theme);
  if (!data?.length) return <ChartEmpty message="Record payments to see history." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...t.grid} />
        <XAxis dataKey="month" tick={t.tick} axisLine={false} tickLine={false} />
        <YAxis tick={t.tick} axisLine={false} tickLine={false} tickFormatter={(v) => `${INR}${v}`} />
        <Tooltip formatter={(v) => rupeeTip(v)} {...t.tooltip} />
        <Bar dataKey="amount" name="Paid" fill={t.series.accent} radius={t.barRadius} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** @param {{ data: { name: string, value: number }[], theme: import('../../../tokens/chartTheme.js').ChartThemeMode }} props */
export function CategoryPieChart({ data, theme }) {
  const t = getChartTheme(theme);
  if (!data?.length) return <ChartEmpty message="No open balances by category." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={56}
          outerRadius={84}
          paddingAngle={2}
          stroke="transparent"
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={t.colors[i % t.colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => rupeeTip(v)} {...t.tooltip} />
        <Legend {...t.legend} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** @param {{ data: object[], theme: import('../../../tokens/chartTheme.js').ChartThemeMode }} props */
export function PressureLineChart({ data, theme }) {
  const t = getChartTheme(theme);
  if (!data?.length) return <ChartEmpty message="Snapshots build over time in Profile." />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...t.grid} />
        <XAxis dataKey="month" tick={t.tick} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={t.tick} axisLine={false} tickLine={false} />
        <Tooltip {...t.tooltip} />
        <Line
          type="monotone"
          dataKey="pressure"
          stroke={t.series.accent}
          strokeWidth={t.lineWidth}
          dot={{ r: t.dotRadius, fill: t.series.accentSoft }}
          activeDot={{ r: t.dotRadius + 2 }}
          name="Score"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** @param {{ data: object[], theme: import('../../../tokens/chartTheme.js').ChartThemeMode }} props */
export function RecurringBarChart({ data, theme }) {
  const t = getChartTheme(theme);
  if (!data?.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...t.grid} />
        <XAxis dataKey="month" tick={t.tick} axisLine={false} tickLine={false} />
        <YAxis tick={t.tick} axisLine={false} tickLine={false} tickFormatter={(v) => `${INR}${v}`} />
        <Tooltip formatter={(v) => rupeeTip(v)} {...t.tooltip} />
        <Bar dataKey="recurringPaid" name="Recurring paid" fill={t.series.accentSoft} radius={t.barRadius} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** @param {{ data: object[], theme: import('../../../tokens/chartTheme.js').ChartThemeMode }} props */
export function FreeCashLineChart({ data, theme }) {
  const t = getChartTheme(theme);
  if (!data?.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...t.grid} />
        <XAxis dataKey="month" tick={t.tick} axisLine={false} tickLine={false} />
        <YAxis tick={t.tick} axisLine={false} tickLine={false} tickFormatter={(v) => `${INR}${v}`} />
        <Tooltip formatter={(v) => rupeeTip(v)} {...t.tooltip} />
        <Line
          type="monotone"
          dataKey="freeMoney"
          stroke={t.series.success}
          strokeWidth={t.lineWidth}
          dot={{ r: t.dotRadius, fill: t.series.success }}
          name="Free cash"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
