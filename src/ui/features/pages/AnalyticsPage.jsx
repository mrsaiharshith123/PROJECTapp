import { useMemo } from "react";
import { Card, InfoTip, PageHeader, Body, Caption, Heading } from "../../";
import AnalyticsChartPanel from "../analytics/AnalyticsChartPanel.jsx";
import { FinancialPulseCard } from "../../";
import ModeIntelligenceSection from "../dashboard/ModeIntelligenceSection.jsx";
import FamilyCalendarWidget from "../dashboard/FamilyCalendarWidget.jsx";
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
  buildPaymentsWithVariableSeries,
  attachVariableSpendToForecast,
} from "../../../utils/analyticsSpendSeries.js";
import { formatInr, EM_DASH } from "../../../constants/symbols.js";
import { ToolsDiscoveryToast } from "../../";
import PaycheckBreakdown from "../analytics/PaycheckBreakdown.jsx";
import { computeSalaryBreakdown } from "../../../engines/salaryBreakdown.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getAnalyticsCopy, getIncomeLabelKey, isSalariedFamily } from "../../../constants/modeExperience.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";

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

  const pressureTrend = useMemo(() => snapshotsToPressureTrend(monthlySnapshots, 8), [monthlySnapshots]);

  const paymentsData = useMemo(
    () => buildPaymentsWithVariableSeries(commitments, dailySpends, 12),
    [commitments, dailySpends],
  );

  const analyticsCopy = getAnalyticsCopy(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));
  const income = combinedMonthlyIncome(settings);
  const today = todayStr || todayYmd();

  const paycheckFlow = useMemo(
    () =>
      analyticsCopy.showPaycheckFlow
        ? computeSalaryBreakdown(commitments, income, getEffectiveStatus, {
            dailySpends,
            todayStr: today,
            profileId: settings.activeProfileId || "default",
          })
        : null,
    [
      analyticsCopy.showPaycheckFlow,
      commitments,
      dailySpends,
      income,
      getEffectiveStatus,
      today,
      settings.activeProfileId,
    ],
  );

  const payerSplitForPaycheck = useMemo(() => {
    if (!isSalariedFamily(settings)) return null;
    const { by } = summarizeHouseholdPayerBurden(commitments, getEffectiveStatus);
    const rows = [];
    if (by.primary > 0) rows.push({ label: t("analytics.payerPrimary"), amount: by.primary });
    if (by.secondary > 0) rows.push({ label: t("analytics.payerSecondary"), amount: by.secondary });
    if (by.shared > 0) rows.push({ label: t("analytics.payerShared"), amount: by.shared });
    if (rows.length === 0) return null;
    return { rows };
  }, [settings, commitments, getEffectiveStatus, t]);

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
    () =>
      computeCurrentMonthSummary(commitments, getEffectiveStatus, today, income, {
        dailySpends,
        lendings,
        getEffectiveLendingStatus,
        profileId: settings.activeProfileId || "default",
      }),
    [
      commitments,
      lendings,
      dailySpends,
      getEffectiveStatus,
      getEffectiveLendingStatus,
      today,
      income,
      settings.activeProfileId,
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
    [lendings, getEffectiveLendingStatus]
  );
  const microTipSeed = commitments.length;

  return (
    <div className="ct-page">
      <PageHeader
        title={t("analytics.title")}
        eyebrow={t("home.insight")}
        subtitle={t("analytics.homeSnapshotHint")}
      />
      {isSalariedFamily(settings) && settings.activeProfileId && settings.activeProfileId !== "default" && (
        <Caption className="ct-text-accent">
          {t("analytics.profileLabel", { id: settings.activeProfileId })}
        </Caption>
      )}

      <FinancialPulseCard microTipSeed={microTipSeed} />

      <Card className="ct-stack" id="paycheck-flow">
        <div>
          <Heading level={3}>{t("analytics.paycheckBurden")}</Heading>
          <Caption className="block mt-1">{t("analytics.paycheckSubtitle")}</Caption>
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

      {isSalariedFamily(settings) && (
        <>
          <ModeIntelligenceSection />
          <FamilyCalendarWidget />
        </>
      )}

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

      <AnalyticsChartPanel
        forecastSeries={forecastSeries}
        paymentsData={paymentsData}
        pressureTrend={pressureTrend}
        dailySpends={dailySpends}
      />

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

      <ToolsDiscoveryToast variant="analytics" />
    </div>
  );
};

export default Analytics;
