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
import { format, subMonths } from "date-fns";
import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { getCategoryById } from "../constants/categories.js";
import { totalPaidOnPayments } from "../utils/commitmentPayments.js";
import {
  snapshotsToPressureTrend,
  debtReductionFromSnapshots,
  recurringGrowthSeries,
  buildDueHeatmap,
  lendingPrincipalInterestTotals,
  lendingCompletionStats,
  freeCashflowTrend,
} from "../engines/analyticsSeries.js";
import { buildCashflowForecastSeries } from "../engines/forecastSeries.js";
import { freeMoneyAfterBurden } from "../engines/pressureScore.js";
import { todayYmd } from "../utils/dates.js";
import { computeCurrentMonthSummary } from "../utils/monthPaymentSummary.js";
import { repeatTypeLabel } from "../constants/repeatTypes.js";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#10b981", "#64748b", "#ef4444", "#06b6d4"];

const CHART_TICK = { fontSize: 11, fill: "#64748b" };
const CHART_GRID = { stroke: "#e2e8f0", strokeDasharray: "4 4" };
const rupeeTip = (v) => (v != null ? `₹${Number(v).toLocaleString("en-IN")}` : "");

const Analytics = () => {
  const {
    commitments,
    lendings,
    settings,
    updateSettings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    monthlySnapshots,
    todayStr,
  } = useCommitTrack();

  const pieData = useMemo(() => {
    const map = {};
    for (const c of commitments) {
      if (getEffectiveStatus(c) === "paid") continue;
      const cat = c.category || "Other";
      map[cat] = (map[cat] || 0) + Math.max(0, Number(c.remainingAmount ?? 0));
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [commitments, getEffectiveStatus]);

  const barData = useMemo(() => {
    const rows = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM");
      let amount = 0;
      for (const c of commitments) {
        for (const p of c.payments || []) {
          if ((p.date || "").startsWith(key)) {
            amount += Math.max(0, Number(p.amount) || 0);
          }
        }
      }
      rows.push({ month: label, key, amount });
    }
    return rows;
  }, [commitments]);

  const openPressure = useMemo(() => {
    return commitments.reduce((s, c) => {
      if (getEffectiveStatus(c) === "paid") return s;
      return s + Math.max(0, Number(c.remainingAmount ?? 0));
    }, 0);
  }, [commitments, getEffectiveStatus]);

  const income = Math.max(0, Number(settings.monthlyIncome) || 0);

  const monthBreakdown = useMemo(
    () => computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr || todayYmd(), income),
    [commitments, getEffectiveStatus, todayStr, income]
  );

  const cashMetrics = useMemo(
    () => freeMoneyAfterBurden(commitments, income, getEffectiveStatus),
    [commitments, income, getEffectiveStatus]
  );
  const freeMoney = Math.max(0, cashMetrics.freeMoney);
  const monthlyBurden = cashMetrics.monthlyBurden;

  const biggestCategory = pieData[0] || null;

  const highestRecurring = useMemo(() => {
    let best = null;
    for (const c of commitments) {
      if (!c.repeatType || c.repeatType === "none") continue;
      const amt = Number(c.amount) || 0;
      if (!best || amt > best.amount) best = { name: c.name, amount: amt, repeatType: c.repeatType };
    }
    return best;
  }, [commitments]);

  const pressureTrend = useMemo(() => snapshotsToPressureTrend(monthlySnapshots, 8), [monthlySnapshots]);
  const debtReduction = useMemo(() => debtReductionFromSnapshots(monthlySnapshots), [monthlySnapshots]);
  const recurringPaidTrend = useMemo(
    () => recurringGrowthSeries(commitments, getEffectiveStatus, 8),
    [commitments, getEffectiveStatus]
  );

  const forecastSeries = useMemo(
    () => buildCashflowForecastSeries(commitments, income, getEffectiveStatus, todayStr || todayYmd(), 12),
    [commitments, income, getEffectiveStatus, todayStr]
  );

  const dueHeatmap = useMemo(
    () =>
      buildDueHeatmap(commitments, lendings, todayStr || todayYmd(), getEffectiveStatus, (l) =>
        getEffectiveLendingStatus(l)
      ),
    [commitments, lendings, todayStr, getEffectiveStatus, getEffectiveLendingStatus]
  );
  const lendingTotals = useMemo(() => lendingPrincipalInterestTotals(lendings), [lendings]);
  const lendingStats = useMemo(
    () => lendingCompletionStats(lendings, getEffectiveLendingStatus),
    [lendings, getEffectiveLendingStatus]
  );
  const freeCashTrend = useMemo(() => freeCashflowTrend(monthlySnapshots, 8), [monthlySnapshots]);
  const maxHeatAmount = Math.max(1, ...dueHeatmap.map((b) => b.amount));

  return (
    <div className="space-y-6 pb-4">
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Insights</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Analytics
        </h1>
        {settings.activeProfileId && settings.activeProfileId !== "default" && (
          <p className="text-xs text-indigo-600 mt-1 font-medium">Profile: {settings.activeProfileId}</p>
        )}
      </div>

      <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-0 shadow-lg space-y-4">
        <div>
          <h2 className="text-base font-semibold text-indigo-100">This month at a glance</h2>
          <p className="text-xs text-indigo-200/90">{monthBreakdown.monthLabel}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase text-indigo-200 font-semibold">Due</p>
            <p className="text-lg font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{monthBreakdown.dueThisMonth.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase text-indigo-200 font-semibold">Paid</p>
            <p className="text-lg font-bold text-emerald-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{monthBreakdown.paidThisMonth.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase text-indigo-200 font-semibold">Left</p>
            <p className="text-lg font-bold text-amber-200" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{monthBreakdown.leftThisMonth.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase text-indigo-200 font-semibold">Free cash</p>
            <p className="text-lg font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              {monthBreakdown.freeCash != null ? `₹${monthBreakdown.freeCash.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>
        <p className="text-xs text-indigo-100/80 leading-relaxed">
          {monthBreakdown.duePercentOfIncome
            ? `Planned bills this month are ${monthBreakdown.duePercentOfIncome} of your income. `
            : "Set monthly income below to see burden vs salary. "}
          Due shows what is still owed this month; Left matches Due after payments. Free cash = income minus paid.
        </p>
      </Card>

      <Card className="space-y-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">Monthly income (₹)</p>
        <p className="text-xs text-gray-500">Used for the pressure card. Stored only on this device.</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={settings.monthlyIncome === 0 ? "" : String(settings.monthlyIncome)}
            onChange={(e) => {
              const raw = e.target.value;
              updateSettings({
                monthlyIncome: raw === "" ? 0 : Math.max(0, Number(raw) || 0),
              });
            }}
            placeholder="0"
          />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white border-0 shadow-lg">
        <p className="text-slate-300 text-sm font-medium mb-4">Financial pressure</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">Income (monthly)</p>
            <p className="text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{income.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Monthly burden</p>
            <p className="text-xl font-bold text-amber-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{monthlyBurden.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Open balance stock: ₹{openPressure.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Free after dues</p>
            <p className="text-xl font-bold text-emerald-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{freeMoney.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Income minus estimated monthly dues</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Biggest category</p>
          {biggestCategory ? (
            <>
              <p className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
                <span>{getCategoryById(biggestCategory.name).icon}</span>
                {getCategoryById(biggestCategory.name).label}
              </p>
              <p className="text-sm text-gray-500 mt-1">₹{biggestCategory.value.toLocaleString()} open</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No open bills</p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Highest recurring</p>
          {highestRecurring ? (
            <>
              <p className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Sora', sans-serif" }}>
                {highestRecurring.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                ₹{highestRecurring.amount.toLocaleString()} · {repeatTypeLabel(highestRecurring.repeatType)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No recurring items</p>
          )}
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Due-date heatmap (next 4 weeks)</h2>
        <p className="text-xs text-gray-500">How many dues cluster in each week for this profile.</p>
        <div className="grid grid-cols-4 gap-2">
          {dueHeatmap.map((b) => (
            <div key={b.label} className="text-center">
              <p className="text-[10px] text-gray-500 mb-1">{b.label}</p>
              <div
                className="mx-auto rounded-lg bg-indigo-100 flex items-end justify-center overflow-hidden"
                style={{ height: 48, width: "100%" }}
              >
                <div
                  className="w-full bg-indigo-500 rounded-t-lg transition-all"
                  style={{ height: `${Math.max(8, (b.amount / maxHeatAmount) * 100)}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-gray-800 mt-1">{b.count} due</p>
              <p className="text-[10px] text-gray-500">₹{Math.round(b.amount).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>

      {lendings.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800">Lending repayment</h2>
          <p className="text-xs text-gray-500">
            {lendingStats.settled} settled · {lendingStats.active} active
            {lendingStats.overdue > 0 ? ` · ${lendingStats.overdue} overdue` : ""}
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Principal paid</p>
              <p className="font-bold text-emerald-800">₹{lendingTotals.principal.toLocaleString()}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Interest paid</p>
              <p className="font-bold text-amber-800">₹{lendingTotals.interest.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      )}

      {freeCashTrend.length >= 2 && (
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800">Free cash trend (snapshots)</h2>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={freeCashTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Line type="monotone" dataKey="freeMoney" stroke="#10b981" strokeWidth={2} dot name="Free cash" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">Free cash forecast (12 months)</h2>
        <p className="text-xs text-gray-500">Estimated dues vs income each month (recurring + one-off due dates).</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Legend />
              <Bar dataKey="due" name="Due" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="free" name="Free cash" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">Pressure score (from snapshots)</h2>
        <p className="text-xs text-gray-500">Canonical stability score recorded monthly when you use the app.</p>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pressureTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={CHART_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="pressure" stroke="#6366f1" strokeWidth={2} dot name="Pressure" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">Recurring payments (cash out)</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={recurringPaidTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="recurringPaid" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {debtReduction && (
        <Card className="text-sm text-gray-700">
          Open balance change {debtReduction.fromMonth} → {debtReduction.toMonth}: ₹
          {Math.round(debtReduction.openDelta).toLocaleString()}{" "}
          {debtReduction.openDelta > 0 ? "(increase)" : debtReduction.openDelta < 0 ? "(reduction)" : ""}
        </Card>
      )}

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">By category (open remaining)</h2>
        <p className="text-xs text-gray-500 mb-2">Share of what you still owe, grouped by category</p>
        <div className="h-64 w-full">
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">Nothing to chart yet</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88}>
                  {pieData.map((_, i) => (
                    <Cell key={pieData[i].name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold text-gray-800">Cash out by month</h2>
        <p className="text-xs text-gray-500 mb-2">Total bill payments recorded per month</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis dataKey="month" tick={CHART_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => rupeeTip(v)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="bg-gray-50 border-gray-100">
        <p className="text-xs text-gray-500">
          All-time recorded payments: ₹
          {commitments.reduce((s, c) => s + totalPaidOnPayments(c.payments), 0).toLocaleString()}
        </p>
      </Card>
    </div>
  );
};

export default Analytics;
