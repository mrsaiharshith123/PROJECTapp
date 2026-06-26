import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { InfoTip, PageShell, Body, Caption, Heading, Button } from "../../";
import { SubPageHeader } from "../../patterns/SubPageHeader.jsx";
import { ViewLink } from "../../patterns/ViewLink.jsx";
import AnalyticsChartPanel from "../analytics/AnalyticsChartPanel.jsx";
import MonthlySpendAnalyticsSection from "../analytics/MonthlySpendAnalyticsSection.jsx";
import BillInsightsCards from "../analytics/BillInsightsCards.jsx";
import HouseholdCommandPanel from "../analytics/HouseholdCommandPanel.jsx";
import HouseholdSpendPanel from "../analytics/HouseholdSpendPanel.jsx";
import FamilyMonthlyReportCard from "../household/FamilyMonthlyReportCard.jsx";
import FinancialPulseCard from "../dashboard/FinancialPulseCard.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { totalPaidOnPayments } from "../../../utils/commitmentPayments.js";
import {
  snapshotsToPressureTrend,
  debtReductionFromSnapshots,
  lendingPrincipalInterestTotals,
  lendingCompletionStats,
} from "../../../engines/analyticsSeries.js";
import { buildCashflowForecastSeries, MONEY_OUTLOOK_WINDOW } from "../../../engines/forecastSeries.js";
import { summarizeHouseholdPayerBurden } from "../../../engines/householdPayer.js";
import { analyzeCreditCardPressure } from "../../../engines/stabilityPlan.js";
import { todayYmd } from "../../../utils/dates.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { computeCurrentMonthSummary } from "../../../utils/monthPaymentSummary.js";
import {
  buildPaymentsOutlookSeries,
  attachVariableSpendToForecast,
} from "../../../utils/analyticsSpendSeries.js";
import { buildEmiConsolidationPlan } from "../../../engines/emiConsolidation.js";
import { formatInr, EM_DASH } from "../../../constants/symbols.js";
import PaycheckBreakdown from "../analytics/PaycheckBreakdown.jsx";
import CashflowCalendarStrip from "../dashboard/CashflowCalendarStrip.jsx";
import { computeSalaryBreakdown } from "../../../engines/salaryBreakdown.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getAnalyticsCopy, getIncomeLabelKey, isSalariedFamily, resolveAnalyticsProfileScope } from "../../../constants/modeExperience.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { TabContent } from "../../patterns/TabContent.jsx";
import { exportAnnualReportToExcel } from "../../../utils/excelExport.js";

function AnalyticsSectionHead({ title, subtitle, tone = "indigo" }) {
  return (
    <div className={`pos-tile ${tone} mx-4 mb-1`}>
      <p className="ct-analytics-section-title">{title}</p>
      {subtitle ? <p className="ct-analytics-section-sub">{subtitle}</p> : null}
    </div>
  );
}

const Analytics = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    commitments,
    lendings,
    dailySpends,
    settings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    monthlySnapshots,
    todayStr,
  } = usePerovo();

  const pressureTrend = useMemo(() => snapshotsToPressureTrend(monthlySnapshots, 7), [monthlySnapshots]);

  const paymentsData = useMemo(
    () => buildPaymentsOutlookSeries(commitments, dailySpends, MONEY_OUTLOOK_WINDOW),
    [commitments, dailySpends],
  );

  const analyticsCopy = getAnalyticsCopy(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));
  const income = combinedMonthlyIncome(settings);
  const isFamily = isSalariedFamily(settings);
  const [householdView, setHouseholdView] = useState(() =>
    location.state?.openHousehold ? "household" : "self",
  );
  const analyticsView = householdView === "household" ? "household" : "self";

  useEffect(() => {
    if (!location.state?.openHousehold) return;
    // Use setTimeout to avoid synchronous navigate-in-effect infinite loop
    const id = setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 0);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const profileScope = resolveAnalyticsProfileScope(settings, isFamily ? analyticsView : "self");
  const today = todayStr || todayYmd();

  const emiPlan = useMemo(() => {
    if (isFamily) return null;
    return buildEmiConsolidationPlan(commitments, getEffectiveStatus);
  }, [isFamily, commitments, getEffectiveStatus]);

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
      <AnalyticsChartPanel
        forecastSeries={forecastSeries}
        paymentsData={paymentsData}
        pressureTrend={pressureTrend}
        dailySpends={dailySpends}
      />

      <BillInsightsCards />

      <div className="pos-tile instrument ct-stack mx-4 mb-2.5" id="paycheck-flow">
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
        />
      </div>
      <div className="ct-row justify-end px-4 -mt-1 mb-1">
        <ViewLink label={t("scoreDetail.viewInstruments")} onClick={() => navigate("/ledger?tab=instruments")} />
      </div>

      {lendings.length > 0 && (
        <div className="pos-tile agreement ct-stack mx-4 mb-2.5">
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
        </div>
      )}

      {debtReduction && (
        <div className="pos-tile liability mx-4 mb-2.5">
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
        </div>
      )}

      <div className="pos-tile asset mx-4 mb-2.5">
        <Caption>
          {t("analytics.allTimePayments")}{" "}
          {formatInr(commitments.reduce((s, c) => s + totalPaidOnPayments(c.payments), 0))}
        </Caption>
      </div>
    </MonthlySpendAnalyticsSection>
  );

  const showSelfView = !isFamily || analyticsView === "self";

  return (
    <div className="ct-page ct-analytics-page pb-8">
      <SubPageHeader title={t("analytics.title")} />
      <p className="ct-page-shell-subtitle px-4 pb-2">
        {isFamily ? t("analytics.homeSnapshotHintHousehold") : t("analytics.homeSnapshotHint")}
      </p>
      <PageShell className="!pt-0">

      {isFamily ? (
        <div>
          <SegmentedControl
            options={householdTabs}
            value={analyticsView}
            onChange={(id) => setHouseholdView(id === "household" ? "household" : "self")}
          />
        </div>
      ) : null}

      <TabContent tabId="self" activeTab={analyticsView}>
        {showSelfView ? (
        <div className="ct-stack">
          <FinancialPulseCard />
          <div className="ct-row justify-end px-4 -mt-2">
            <ViewLink label={t("home.position.tapLedger")} onClick={() => navigate("/ledger?tab=liabilities")} />
          </div>
          <div className="ct-animate-fade-up" style={{ animationDelay: "60ms" }}>
            <CashflowCalendarStrip />
          </div>

          <div className="ct-analytics-section-divider" />
          <AnalyticsSectionHead title={t("analytics.section.spending")} subtitle={t("analytics.section.spendingHint")} tone="liability" />
          <div className="ct-row justify-end px-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                exportAnnualReportToExcel({
                  commitments,
                  lendings,
                  snapshots: monthlySnapshots,
                })
              }
            >
              {t("analytics.exportCa")}
            </Button>
          </div>
          {emiPlan ? (
            <div className="pos-tile liability ct-stack-sm ct-animate-fade-up mx-4 mb-2.5" style={{ animationDelay: "60ms" }}>
              <Heading level={3}>
                {t("analytics.emiConsolidation.title")}
                <InfoTip textKey="analytics.emiConsolidation.subtitle" />
              </Heading>
              <ol className="ct-stack-sm mt-2">
                {emiPlan.plan.map((row) => (
                  <li key={`${row.name}-${row.endDate}`} className="ct-caption">
                    {t("analytics.emiConsolidation.row", {
                      months: row.monthsRemaining,
                      name: row.name,
                      amount: formatInr(row.amount),
                    })}
                  </li>
                ))}
              </ol>
              <Body className="font-semibold">
                {t("analytics.emiConsolidation.totalRelief", { amount: formatInr(emiPlan.totalRelief) })}
              </Body>
              <Caption className="block">
                {t(emiPlan.insightKey, emiPlan.insightParams)}
              </Caption>
            </div>
          ) : null}
          <div className="ct-animate-fade-up ct-list-animate" style={{ animationDelay: "120ms" }}>
            {monthlySection}
          </div>
        </div>
        ) : null}
      </TabContent>

      <TabContent tabId="household" activeTab={analyticsView}>
        {!showSelfView ? (
        <div className="ct-stack ct-list-animate">
          <AnalyticsSectionHead title={t("analytics.section.household")} subtitle={t("analytics.section.householdHint")} tone="agreement" />
          <div className="ct-animate-fade-up" style={{ animationDelay: "0ms" }}>
            <HouseholdCommandPanel />
          </div>
          <div className="ct-animate-fade-up" style={{ animationDelay: "60ms" }}>
            <HouseholdSpendPanel />
          </div>
          <FamilyMonthlyReportCard />
        </div>
        ) : null}
      </TabContent>
    </PageShell>
    </div>
  );
};

export default Analytics;
