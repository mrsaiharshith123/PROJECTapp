import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { Card, InfoTip, PageHeader, Body, Caption } from "../../";
import AnalyticsChartPanel from "../analytics/AnalyticsChartPanel.jsx";
import { MoneyMonthPanel } from "../analytics/MoneyMonthPanel.jsx";
import { MoneyAffordPanel } from "../analytics/MoneyAffordPanel.jsx";
import { InsightStatCard } from "../analytics/InsightStatCard.jsx";
import { DueHeatmapCard } from "../analytics/DueHeatmapCard.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { getCategoryById } from "../../../constants/categories.js";
import { totalPaidOnPayments } from "../../../utils/commitmentPayments.js";
import {
  snapshotsToPressureTrend,
  debtReductionFromSnapshots,
  recurringGrowthSeries,
  buildDueHeatmap,
  lendingPrincipalInterestTotals,
  lendingCompletionStats,
  freeCashflowTrend,
} from "../../../engines/analyticsSeries.js";
import { buildCashflowForecastSeries } from "../../../engines/forecastSeries.js";
import { freeMoneyAfterBurden, buildIncomeSensitivityRows } from "../../../engines/pressureScore.js";
import { summarizeHouseholdPayerBurden } from "../../../engines/householdPayer.js";
import { analyzeCreditCardPressure } from "../../../engines/stabilityPlan.js";
import { todayYmd } from "../../../utils/dates.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { computeCurrentMonthSummary } from "../../../utils/monthPaymentSummary.js";
import { repeatTypeLabel } from "../../../constants/repeatTypes.js";
import { formatInr, EM_DASH, ARROW } from "../../../constants/symbols.js";
import { PROFILE_SETTINGS_HINT } from "../../../constants/plainLanguage.js";
import { ToolsDiscoveryToast } from "../../";
import PaycheckBreakdown from "../analytics/PaycheckBreakdown.jsx";
import SubscriptionLeakCard from "../analytics/SubscriptionLeakCard.jsx";
import { computeSalaryBreakdown } from "../../../engines/salaryBreakdown.js";
import { getAnalyticsCopy, getIncomeLabel, isSalariedFamily } from "../../../constants/modeExperience.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";

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

  const monthFooter =
    (monthBreakdown.duePercentOfIncome
      ? `Planned bills this month are ${monthBreakdown.duePercentOfIncome} of your income. `
      : `${PROFILE_SETTINGS_HINT} `) +
    "Due shows what is still owed this month; Left matches Due after payments. Free cash = income minus paid.";

  return (
    <div className="ct-page">
      <PageHeader
        title="Analytics"
        eyebrow="Money picture"
        subtitle="Simple summaries first. Extra charts are optional."
      />
      {isSalariedFamily(settings) && settings.activeProfileId && settings.activeProfileId !== "default" && (
        <Caption className="ct-text-accent">Profile: {settings.activeProfileId}</Caption>
      )}

      <MoneyMonthPanel
        title={analyticsCopy.monthTitle}
        monthLabel={monthBreakdown.monthLabel}
        hint={analyticsCopy.monthHint}
        metrics={[
          { label: "Due", value: formatInr(monthBreakdown.dueThisMonth), tip: CALC_HELP.dueThisMonth },
          { label: "Paid", value: formatInr(monthBreakdown.paidThisMonth), tone: "success" },
          { label: "Left", value: formatInr(monthBreakdown.leftThisMonth), tone: "warn" },
          {
            label: "Free cash",
            value: monthBreakdown.freeCash != null ? formatInr(monthBreakdown.freeCash) : EM_DASH,
            tip: CALC_HELP.freeCash,
          },
        ]}
        footer={monthFooter}
      >
        <PaycheckBreakdown
          breakdown={paycheckFlow}
          incomeStepLabel={incomeLabel}
          incomeEntryBasis={settings.incomeEntryBasis === "gross" ? "gross" : "take_home"}
          payerSplit={payerSplitForPaycheck}
          creditCard={cardPressureAnalytics}
          sensitivityRows={paycheckSensitivity}
        />
      </MoneyMonthPanel>

      <MoneyAffordPanel
        title={analyticsCopy.affordTitle}
        hint={analyticsCopy.affordHint}
        rows={[
          { label: incomeLabel, value: formatInr(income) },
          {
            label: "Monthly burden",
            value: formatInr(monthlyBurden),
            tone: "warn",
            tip: CALC_HELP.monthlyBurden,
            sub: (
              <>
                Still owed overall: {formatInr(openPressure)}
                <InfoTip text={CALC_HELP.openBalance} />
              </>
            ),
          },
          {
            label: "Free after dues",
            value: formatInr(freeMoney),
            tone: "success",
            tip: CALC_HELP.freeAfterDues,
            sub: `${incomeLabel} minus estimated monthly dues`,
          },
        ]}
      />

      <div className="ct-grid-2">
        <InsightStatCard
          eyebrow="Biggest category"
          icon={biggestCategory ? getCategoryById(biggestCategory.name).icon : undefined}
          title={biggestCategory ? getCategoryById(biggestCategory.name).label : undefined}
          detail={biggestCategory ? `${formatInr(biggestCategory.value)} open` : undefined}
          empty="No open bills"
        />
        <InsightStatCard
          eyebrow="Highest recurring"
          title={highestRecurring?.name}
          detail={
            highestRecurring
              ? `${formatInr(highestRecurring.amount)} ${EM_DASH} ${repeatTypeLabel(highestRecurring.repeatType)}`
              : undefined
          }
          empty="No recurring items"
        />
      </div>

      <DueHeatmapCard buckets={dueHeatmap} maxAmount={maxHeatAmount} />

      {lendings.length > 0 && (
        <Card className="ct-stack">
          <Body className="ct-body-strong">Lending repayment</Body>
          <Caption>
            {lendingStats.settled} settled {EM_DASH} {lendingStats.active} active
            {lendingStats.overdue > 0 ? ` ${EM_DASH} ${lendingStats.overdue} overdue` : ""}
          </Caption>
          <div className="ct-grid-2">
            <div className="ct-metric-pair-success">
              <Caption>Principal paid</Caption>
              <p className="ct-display">{formatInr(lendingTotals.principal)}</p>
            </div>
            <div className="ct-metric-pair-warning">
              <Caption>Interest paid</Caption>
              <p className="ct-display">{formatInr(lendingTotals.interest)}</p>
            </div>
          </div>
        </Card>
      )}

      <SubscriptionLeakCard />

      <AnalyticsChartPanel
        forecastSeries={forecastSeries}
        barData={barData}
        pieData={pieData}
        pressureTrend={pressureTrend}
        recurringPaidTrend={recurringPaidTrend}
        freeCashTrend={freeCashTrend}
      />

      {debtReduction && (
        <Card>
          <Body className="!text-sm inline-flex items-center gap-1">
            Balance change
            <InfoTip text={CALC_HELP.debtTrend} />
            {debtReduction.fromMonth} {ARROW} {debtReduction.toMonth}:{" "}
            {formatInr(Math.round(debtReduction.openDelta))}{" "}
            {debtReduction.openDelta > 0 ? "(increase)" : debtReduction.openDelta < 0 ? "(reduction)" : ""}
          </Body>
        </Card>
      )}

      <Card variant="flat">
        <Caption>
          All-time recorded payments:{" "}
          {formatInr(commitments.reduce((s, c) => s + totalPaidOnPayments(c.payments), 0))}
        </Caption>
      </Card>

      <ToolsDiscoveryToast variant="analytics" />
    </div>
  );
};

export default Analytics;
