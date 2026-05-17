import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import Card from "../components/Card";
import AnalyticsChartPanel from "../components/AnalyticsChartPanel.jsx";
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
import { formatInr, EM_DASH, ARROW } from "../constants/symbols.js";
import { PROFILE_SETTINGS_HINT } from "../constants/plainLanguage.js";
import ToolsDiscoveryToast from "../components/dashboard/ToolsDiscoveryPrompt.jsx";

const Analytics = () => {
  const {
    commitments,
    lendings,
    settings,
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
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Money picture</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Analytics
        </h1>
        <p className="text-xs text-gray-500 mt-1">Simple summaries first. Extra charts are optional.</p>
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
              {formatInr(monthBreakdown.dueThisMonth)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase text-indigo-200 font-semibold">Paid</p>
            <p className="text-lg font-bold text-emerald-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              {formatInr(monthBreakdown.paidThisMonth)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase text-indigo-200 font-semibold">Left</p>
            <p className="text-lg font-bold text-amber-200" style={{ fontFamily: "'Sora', sans-serif" }}>
              {formatInr(monthBreakdown.leftThisMonth)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase text-indigo-200 font-semibold">Free cash</p>
            <p className="text-lg font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              {monthBreakdown.freeCash != null ? formatInr(monthBreakdown.freeCash) : EM_DASH}
            </p>
          </div>
        </div>
        <p className="text-xs text-indigo-100/80 leading-relaxed">
          {monthBreakdown.duePercentOfIncome
            ? `Planned bills this month are ${monthBreakdown.duePercentOfIncome} of your income. `
            : `${PROFILE_SETTINGS_HINT} `}
          Due shows what is still owed this month; Left matches Due after payments. Free cash = income minus paid.
        </p>
      </Card>

      <Card className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white border-0 shadow-lg">
        <p className="text-slate-300 text-sm font-medium mb-4">Can you afford your bills?</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">Income (monthly)</p>
            <p className="text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              {formatInr(income)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Monthly burden</p>
            <p className="text-xl font-bold text-amber-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              {formatInr(monthlyBurden)}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Still owed overall: {formatInr(openPressure)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1">Free after dues</p>
            <p className="text-xl font-bold text-emerald-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              {formatInr(freeMoney)}
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
              <p className="text-sm text-gray-500 mt-1">{formatInr(biggestCategory.value)} open</p>
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
                {formatInr(highestRecurring.amount)} {EM_DASH} {repeatTypeLabel(highestRecurring.repeatType)}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No recurring items</p>
          )}
        </Card>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Upcoming due dates (4 weeks)</h2>
        <p className="text-xs text-gray-500">Which weeks have the most bills due.</p>
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
              <p className="text-[10px] text-gray-500">{formatInr(Math.round(b.amount))}</p>
            </div>
          ))}
        </div>
      </Card>

      {lendings.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800">Lending repayment</h2>
          <p className="text-xs text-gray-500">
            {lendingStats.settled} settled {EM_DASH} {lendingStats.active} active
            {lendingStats.overdue > 0 ? ` ${EM_DASH} ${lendingStats.overdue} overdue` : ""}
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Principal paid</p>
              <p className="font-bold text-emerald-800">{formatInr(lendingTotals.principal)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Interest paid</p>
              <p className="font-bold text-amber-800">{formatInr(lendingTotals.interest)}</p>
            </div>
          </div>
        </Card>
      )}

      <AnalyticsChartPanel
        forecastSeries={forecastSeries}
        barData={barData}
        pieData={pieData}
        pressureTrend={pressureTrend}
        recurringPaidTrend={recurringPaidTrend}
        freeCashTrend={freeCashTrend}
      />

      {debtReduction && (
        <Card className="text-sm text-gray-700">
          Balance change {debtReduction.fromMonth} {ARROW} {debtReduction.toMonth}:{" "}
          {formatInr(Math.round(debtReduction.openDelta))}{" "}
          {debtReduction.openDelta > 0 ? "(increase)" : debtReduction.openDelta < 0 ? "(reduction)" : ""}
        </Card>
      )}

      <Card className="bg-gray-50 border-gray-100">
        <p className="text-xs text-gray-500">
          All-time recorded payments:{" "}
          {formatInr(commitments.reduce((s, c) => s + totalPaidOnPayments(c.payments), 0))}
        </p>
      </Card>

      <ToolsDiscoveryToast variant="analytics" />
    </div>
  );
};

export default Analytics;
