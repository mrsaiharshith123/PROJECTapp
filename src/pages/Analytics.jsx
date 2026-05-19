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
import { freeMoneyAfterBurden, buildIncomeSensitivityRows } from "../engines/pressureScore.js";
import { summarizeHouseholdPayerBurden } from "../engines/householdPayer.js";
import { analyzeCreditCardPressure } from "../engines/stabilityPlan.js";
import { todayYmd } from "../utils/dates.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import { computeCurrentMonthSummary } from "../utils/monthPaymentSummary.js";
import { repeatTypeLabel } from "../constants/repeatTypes.js";
import { formatInr, EM_DASH, ARROW } from "../constants/symbols.js";
import { PROFILE_SETTINGS_HINT } from "../constants/plainLanguage.js";
import ToolsDiscoveryToast from "../components/dashboard/ToolsDiscoveryPrompt.jsx";
import PaycheckBreakdown from "../components/analytics/PaycheckBreakdown.jsx";
import { computeSalaryBreakdown } from "../engines/salaryBreakdown.js";
import { getAnalyticsCopy, getIncomeLabel, isSalariedFamily } from "../constants/modeExperience.js";
import InfoTip from "../components/InfoTip.jsx";
import { CALC_HELP } from "../constants/calculationHelp.js";

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

  const analyticsCopy = getAnalyticsCopy(settings);
  const incomeLabel = getIncomeLabel(settings);
  const income = combinedMonthlyIncome(settings);

  const paycheckFlow = useMemo(
    () =>
      analyticsCopy.showPaycheckFlow
        ? computeSalaryBreakdown(commitments, income, getEffectiveStatus)
        : null,
    [analyticsCopy.showPaycheckFlow, commitments, income, getEffectiveStatus]
  );

  const payerSplitForPaycheck = useMemo(() => {
    if (!isSalariedFamily(settings)) return null;
    const { by } = summarizeHouseholdPayerBurden(commitments, getEffectiveStatus);
    const rows = [];
    if (by.primary > 0) rows.push({ label: "Primary payer (open est.)", amount: by.primary });
    if (by.secondary > 0) rows.push({ label: "Second payer (open est.)", amount: by.secondary });
    if (by.shared > 0) rows.push({ label: "Shared (open est.)", amount: by.shared });
    if (rows.length === 0) return null;
    return { rows };
  }, [settings, commitments, getEffectiveStatus]);

  const cardPressureAnalytics = useMemo(
    () => (analyticsCopy.showPaycheckFlow ? analyzeCreditCardPressure(commitments, getEffectiveStatus, income) : null),
    [analyticsCopy.showPaycheckFlow, commitments, getEffectiveStatus, income]
  );

  const paycheckSensitivity = useMemo(
    () =>
      analyticsCopy.showPaycheckFlow && income > 0
        ? buildIncomeSensitivityRows(commitments, income, getEffectiveStatus)
        : [],
    [analyticsCopy.showPaycheckFlow, commitments, income, getEffectiveStatus]
  );

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
    () =>
      buildCashflowForecastSeries(commitments, income, getEffectiveStatus, todayStr || todayYmd(), 12, {
        lendings,
        getEffectiveLendingStatus,
      }),
    [commitments, income, getEffectiveStatus, todayStr, lendings, getEffectiveLendingStatus]
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
        {isSalariedFamily(settings) && settings.activeProfileId && settings.activeProfileId !== "default" && (
          <p className="text-xs text-indigo-600 mt-1 font-medium">Profile: {settings.activeProfileId}</p>
        )}
      </div>

      <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-0 shadow-lg space-y-4">
        <div>
          <h2 className="text-base font-semibold text-indigo-100">{analyticsCopy.monthTitle}</h2>
          <p className="text-xs text-indigo-200/90">{monthBreakdown.monthLabel}</p>
          <p className="text-[11px] text-indigo-200/70 mt-1">{analyticsCopy.monthHint}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[10px] uppercase text-indigo-200 font-semibold inline-flex items-center">
              Due
              <InfoTip text={CALC_HELP.dueThisMonth} />
            </p>
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
            <p className="text-[10px] uppercase text-indigo-200 font-semibold inline-flex items-center">
              Free cash
              <InfoTip text={CALC_HELP.freeCash} />
            </p>
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
        <PaycheckBreakdown
          breakdown={paycheckFlow}
          incomeStepLabel={incomeLabel}
          incomeEntryBasis={settings.incomeEntryBasis === "gross" ? "gross" : "take_home"}
          payerSplit={payerSplitForPaycheck}
          creditCard={cardPressureAnalytics}
          sensitivityRows={paycheckSensitivity}
        />
      </Card>

      <Card className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white border-0 shadow-lg space-y-2">
        <div>
          <p className="text-slate-300 text-sm font-medium">{analyticsCopy.affordTitle}</p>
          <p className="text-[11px] text-slate-500 mt-1">{analyticsCopy.affordHint}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-slate-400 text-xs mb-1">{incomeLabel}</p>
            <p className="text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              {formatInr(income)}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1 inline-flex items-center">
              Monthly burden
              <InfoTip text={CALC_HELP.monthlyBurden} />
            </p>
            <p className="text-xl font-bold text-amber-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              {formatInr(monthlyBurden)}
            </p>
            <p className="text-[10px] text-slate-500 mt-1 inline-flex items-center">
              Still owed overall: {formatInr(openPressure)}
              <InfoTip text={CALC_HELP.openBalance} />
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1 inline-flex items-center">
              Free after dues
              <InfoTip text={CALC_HELP.freeAfterDues} />
            </p>
            <p className="text-xl font-bold text-emerald-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              {formatInr(freeMoney)}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">{incomeLabel} minus estimated monthly dues</p>
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
        <h2 className="text-base font-semibold text-gray-800 inline-flex items-center">
          Upcoming due dates (4 weeks)
          <InfoTip text={CALC_HELP.dueHeatmap} />
        </h2>
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
          <span className="inline-flex items-center">
            Balance change
            <InfoTip text={CALC_HELP.debtTrend} />
          </span>{" "}
          {debtReduction.fromMonth} {ARROW} {debtReduction.toMonth}:{" "}
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
