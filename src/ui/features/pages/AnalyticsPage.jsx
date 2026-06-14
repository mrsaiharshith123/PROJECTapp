import { useMemo, useState } from "react";
import { Card, InfoTip, PageHeader, Body, Caption, Heading } from "../../";
import AnalyticsChartPanel from "../analytics/AnalyticsChartPanel.jsx";
import MonthlySpendAnalyticsSection from "../analytics/MonthlySpendAnalyticsSection.jsx";
import BillInsightsCards from "../analytics/BillInsightsCards.jsx";
import HouseholdCommandPanel from "../analytics/HouseholdCommandPanel.jsx";
import HouseholdSpendPanel from "../analytics/HouseholdSpendPanel.jsx";
import FamilyModeDashboard from "../dashboard/FamilyModeDashboard.jsx";
import FamilyCalendarWidget from "../dashboard/FamilyCalendarWidget.jsx";
import { FinancialPulseCard } from "../../";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { totalPaidOnPayments } from "../../../utils/commitmentPayments.js";
import {
  snapshotsToPressureTrend,
  debtReductionFromSnapshots,
  lendingPrincipalInterestTotals,
  lendingCompletionStats,
} from "../../../engines/analyticsSeries.js";
import { buildCashflowForecastSeries, MONEY_OUTLOOK_WINDOW } from "../../../engines/forecastSeries.js";
import { buildIncomeSensitivityRows } from "../../../engines/pressureScore.js";
import { summarizeHouseholdPayerBurden } from "../../../engines/householdPayer.js";
import { analyzeCreditCardPressure } from "../../../engines/stabilityPlan.js";
import { todayYmd } from "../../../utils/dates.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { computeCurrentMonthSummary } from "../../../utils/monthPaymentSummary.js";
import {
  buildPaymentsOutlookSeries,
  attachVariableSpendToForecast,
} from "../../../utils/analyticsSpendSeries.js";
import { formatInr, EM_DASH } from "../../../constants/symbols.js";
import { ToolsDiscoveryToast } from "../../";
import PaycheckBreakdown from "../analytics/PaycheckBreakdown.jsx";
import CashflowCalendarStrip from "../dashboard/CashflowCalendarStrip.jsx";
import { computeSalaryBreakdown } from "../../../engines/salaryBreakdown.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getAnalyticsCopy, getIncomeLabelKey, isSalariedFamily, resolveAnalyticsProfileScope } from "../../../constants/modeExperience.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";

const Analytics = () => {
  const { t } = useTranslation();
  const {
    commitments,
    lendings,
    dailySpends,
    settings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    monthlySnapshots,
    todayStr,
  } = useCommitTrack();

  const pressureTrend = useMemo(() => snapshotsToPressureTrend(monthlySnapshots, 7), [monthlySnapshots]);

  const paymentsData = useMemo(
    () => buildPaymentsOutlookSeries(commitments, dailySpends, MONEY_OUTLOOK_WINDOW),
    [commitments, dailySpends],
  );

  const analyticsCopy = getAnalyticsCopy(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));
  const income = combinedMonthlyIncome(settings);
  const isFamily = isSalariedFamily(settings);
  const [householdView, setHouseholdView] = useState("self");
  const analyticsView = householdView === "household" ? "household" : "self";
  const profileScope = resolveAnalyticsProfileScope(settings, isFamily ? analyticsView : "self");
  const today = todayStr || todayYmd();
  const microTipSeed = commitments.length;

  const paycheckFlow = useMemo(
    () =>
      analyticsCopy.showPaycheckFlow
        ? computeSalaryBreakdown(commitments, income, getEffectiveStatus, {
            dailySpends,
            todayStr: today,
            profileId: profileScope,
          })
        : null,
    [
      analyticsCopy.showPaycheckFlow,
      commitments,
      dailySpends,
      income,
      getEffectiveStatus,
      today,
      profileScope,
    ],
  );

  const payerSplitForPaycheck = useMemo(() => {
    if (!isFamily || analyticsView !== "household") return null;
    const { by } = summarizeHouseholdPayerBurden(commitments, getEffectiveStatus);
    const rows = [];
    if (by.primary > 0) rows.push({ label: t("analytics.payerPrimary"), amount: by.primary });
    if (by.secondary > 0) rows.push({ label: t("analytics.payerSecondary"), amount: by.secondary });
    if (by.shared > 0) rows.push({ label: t("analytics.payerShared"), amount: by.shared });
    if (rows.length === 0) return null;
    return { rows };
  }, [commitments, getEffectiveStatus, t, isFamily, analyticsView]);

  const cardPressureAnalytics = useMemo(
    () => (analyticsCopy.showPaycheckFlow ? analyzeCreditCardPressure(commitments, getEffectiveStatus, income) : null),
    [analyticsCopy.showPaycheckFlow, commitments, getEffectiveStatus, income],
  );

  const paycheckSensitivity = useMemo(
    () =>
      analyticsCopy.showPaycheckFlow && income > 0
        ? buildIncomeSensitivityRows(commitments, income, getEffectiveStatus)
        : [],
    [analyticsCopy.showPaycheckFlow, commitments, income, getEffectiveStatus],
  );

  const monthBreakdown = useMemo(
    () =>
      computeCurrentMonthSummary(commitments, getEffectiveStatus, today, income, {
        dailySpends,
        lendings,
        getEffectiveLendingStatus,
        profileId: profileScope,
      }),
    [
      commitments,
      lendings,
      dailySpends,
      getEffectiveStatus,
      getEffectiveLendingStatus,
      today,
      income,
      profileScope,
    ],
  );

  const debtReduction = useMemo(() => debtReductionFromSnapshots(monthlySnapshots), [monthlySnapshots]);
  const forecastSeries = useMemo(() => {
    const rows = buildCashflowForecastSeries(
      commitments,
      income,
      getEffectiveStatus,
      today,
      MONEY_OUTLOOK_WINDOW.months,
      {
        startOffset: MONEY_OUTLOOK_WINDOW.startOffset,
        lendings,
        getEffectiveLendingStatus,
      },
    );
    return attachVariableSpendToForecast(rows, dailySpends);
  }, [commitments, income, getEffectiveStatus, today, lendings, getEffectiveLendingStatus, dailySpends]);

  const lendingTotals = useMemo(() => lendingPrincipalInterestTotals(lendings), [lendings]);
  const lendingStats = useMemo(
    () => lendingCompletionStats(lendings, getEffectiveLendingStatus),
    [lendings, getEffectiveLendingStatus],
  );

  const householdTabs = [
    { id: "self", label: t("analytics.household.viewSelf") },
    { id: "household", label: t("analytics.household.viewHouse") },
  ];

  const monthlySection = (
    <MonthlySpendAnalyticsSection>
      <BillInsightsCards />

      <Card className="ct-stack" id="paycheck-flow">
        <div>
          <Heading level={3}>
            {isFamily && analyticsView === "household"
              ? t("analytics.paycheckBurdenHousehold")
              : t("analytics.paycheckBurden")}
          </Heading>
          <Caption className="block mt-1">
            {isFamily && analyticsView === "household"
              ? t("analytics.paycheckSubtitleHousehold")
              : t("analytics.paycheckSubtitle")}
          </Caption>
        </div>
        <PaycheckBreakdown
          breakdown={paycheckFlow}
          incomeStepLabel={incomeLabel}
          incomeEntryBasis={settings.incomeEntryBasis === "gross" ? "gross" : "take_home"}
          payerSplit={payerSplitForPaycheck}
          creditCard={cardPressureAnalytics}
          sensitivityRows={paycheckSensitivity}
        />
      </Card>

      <AnalyticsChartPanel
        forecastSeries={forecastSeries}
        paymentsData={paymentsData}
        pressureTrend={pressureTrend}
        dailySpends={dailySpends}
      />

      {lendings.length > 0 && (
        <Card className="ct-stack">
          <Body className="ct-body-strong">{t("analytics.lendingRepayment")}</Body>
          <Caption>
            {t("analytics.lendingSettled", { settled: lendingStats.settled })} {EM_DASH}{" "}
            {t("analytics.lendingActive", { active: lendingStats.active })}
            {lendingStats.overdue > 0
              ? ` ${EM_DASH} ${t("analytics.lendingOverdue", { overdue: lendingStats.overdue })}`
              : ""}
            {monthBreakdown.lendingDueThisMonth > 0
              ? ` ${EM_DASH} ${t("analytics.lendingDueMonth", { amount: formatInr(monthBreakdown.lendingDueThisMonth) })}`
              : ""}
          </Caption>
          <div className="ct-grid-2">
            <div className="ct-metric-pair-success">
              <Caption>{t("analytics.lendingPrincipalPaid")}</Caption>
              <p className="ct-display ct-numeral">{formatInr(lendingTotals.principal)}</p>
            </div>
            <div className="ct-metric-pair-warning">
              <Caption>{t("analytics.lendingInterestPaid")}</Caption>
              <p className="ct-display ct-numeral">{formatInr(lendingTotals.interest)}</p>
            </div>
          </div>
        </Card>
      )}

      {debtReduction && (
        <Card>
          <Body className="!text-sm inline-flex items-center gap-1">
            {t("analytics.balanceChange")}
            <InfoTip text={CALC_HELP.debtTrend} />
            {t("analytics.balanceDelta", {
              from: debtReduction.fromMonth,
              to: debtReduction.toMonth,
              amount: formatInr(Math.round(debtReduction.openDelta)),
            })}{" "}
            {debtReduction.openDelta > 0
              ? t("analytics.balanceIncrease")
              : debtReduction.openDelta < 0
                ? t("analytics.balanceReduction")
                : ""}
          </Body>
        </Card>
      )}

      <Card variant="flat">
        <Caption>
          {t("analytics.allTimePayments")}{" "}
          {formatInr(commitments.reduce((s, c) => s + totalPaidOnPayments(c.payments), 0))}
        </Caption>
      </Card>
    </MonthlySpendAnalyticsSection>
  );

  const showSelfView = !isFamily || analyticsView === "self";

  return (
    <div className="ct-page">
      <PageHeader
        title={t("analytics.title")}
        eyebrow={isFamily ? t("analytics.eyebrowHousehold") : t("home.insight")}
        subtitle={isFamily ? t("analytics.homeSnapshotHintHousehold") : t("analytics.homeSnapshotHint")}
      />

      {isFamily ? (
        <div>
          <SegmentedControl
            options={householdTabs}
            value={analyticsView}
            onChange={(id) => setHouseholdView(id === "household" ? "household" : "self")}
          />
          <Caption className="block mt-2">
            {showSelfView ? t("analytics.household.selfHint") : t("analytics.household.houseHint")}
          </Caption>
        </div>
      ) : null}

      {showSelfView ? (
        <div className="ct-stack">
          <FinancialPulseCard microTipSeed={microTipSeed} pulseScope="personal" />
          <CashflowCalendarStrip />
          {monthlySection}
        </div>
      ) : (
        <div className="ct-stack">
          <HouseholdCommandPanel />
          <FinancialPulseCard microTipSeed={microTipSeed} pulseScope="household" />
          <HouseholdSpendPanel />
          <FamilyModeDashboard />
          <FamilyCalendarWidget />
        </div>
      )}

      <ToolsDiscoveryToast variant="analytics" />
    </div>
  );
};

export default Analytics;
