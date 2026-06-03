import { useMemo, useState } from "react";
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
import { Card } from "../../index.js";
import { CHART_VIEWS, CHART_VIEWS_ADVANCED } from "../../../constants/plainLanguage.js";
import { formatInr, INR } from "../../../constants/symbols.js";

const CHART_TICK = { fontSize: 11, fill: "#64748b" };
const CHART_GRID = { stroke: "#e2e8f0", strokeDasharray: "4 4" };
const PIE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#10b981", "#64748b", "#ef4444"];
const rupeeTip = (v) => (v != null ? formatInr(v) : "");

export default function AnalyticsChartPanel({
  forecastSeries,
  barData,
  pieData,
  pressureTrend,
  recurringPaidTrend,
  freeCashTrend,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const advancedAvailable = useMemo(() => {
    return CHART_VIEWS_ADVANCED.filter((v) => {
      if (v.id === "freecash") return freeCashTrend.length >= 2;
      if (v.id === "pressure") return pressureTrend.length >= 1;
      return true;
    });
  }, [freeCashTrend, pressureTrend]);

  const mainAvailable = useMemo(() => {
    return CHART_VIEWS.filter((v) => {
      if (v.id === "categories") return pieData.length > 0;
      return true;
    });
  }, [pieData]);

  const allViews = useMemo(
    () => [...mainAvailable, ...(showAdvanced ? advancedAvailable : [])],
    [mainAvailable, advancedAvailable, showAdvanced]
  );

  const [preferredViewId, setPreferredViewId] = useState("forecast");
  const viewId = allViews.some((v) => v.id === preferredViewId)
    ? preferredViewId
    : allViews[0]?.id || "forecast";

  const current = allViews.find((v) => v.id === viewId) || allViews[0];
  const currentId = current?.id || "forecast";

  const renderChart = () => {
    switch (currentId) {
      case "forecast":
        return (
          <BarChart data={forecastSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${INR}${v}`} />
            <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
            <Legend />
            <Bar dataKey="due" name="Still due" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="free" name="Likely free" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "payments":
        return (
          <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${INR}${v}`} />
            <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
            <Bar dataKey="amount" name="Paid" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        );
      case "categories":
        if (pieData.length === 0) {
          return <p className="text-sm text-gray-400 text-center py-16">Nothing to show yet.</p>;
        }
        return (
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88}>
              {pieData.map((_, i) => (
                <Cell key={pieData[i].name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        );
      case "pressure":
        return (
          <LineChart data={pressureTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={CHART_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
            <Line type="monotone" dataKey="pressure" stroke="#6366f1" strokeWidth={2} dot name="Score" />
          </LineChart>
        );
      case "recurring":
        return (
          <BarChart data={recurringPaidTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${INR}${v}`} />
            <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
            <Bar dataKey="recurringPaid" name="Recurring paid" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case "freecash":
        return (
          <LineChart data={freeCashTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `${INR}${v}`} />
            <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
            <Line type="monotone" dataKey="freeMoney" stroke="#10b981" strokeWidth={2} dot name="Free cash" />
          </LineChart>
        );
      default:
        return null;
    }
  };

  const height = currentId === "categories" ? 280 : 256;

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">Charts</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Pick one view at a time. Most people only need the first three.
        </p>
      </div>

      <label className="sm:hidden block">
        <span className="sr-only">Chart</span>
        <select
          value={currentId}
          onChange={(e) => setPreferredViewId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-medium"
        >
          {allViews.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </label>

      <div className="hidden sm:flex flex-wrap gap-1.5">
        {allViews.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setPreferredViewId(v.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              currentId === v.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {advancedAvailable.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400"
        >
          {showAdvanced ? "Hide extra charts" : "Show extra charts (optional)"}
        </button>
      )}

      <p className="text-sm text-gray-700 dark:text-slate-200">{current?.label}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400 -mt-2">{current?.hint}</p>

      <div className="w-full" style={{ height }}>
        {currentId === "categories" && pieData.length === 0 ? (
          renderChart()
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
