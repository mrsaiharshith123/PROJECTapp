import { useMemo } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { SubPageHeader } from "../../patterns/SubPageHeader.jsx";
import { ViewLink } from "../../patterns/ViewLink.jsx";
import FinancialPulseCard from "../dashboard/FinancialPulseCard.jsx";
import AnalyticsChartPanel from "../analytics/AnalyticsChartPanel.jsx";
import MonthlySpendAnalyticsSection from "../analytics/MonthlySpendAnalyticsSection.jsx";
import BillInsightsCards from "../analytics/BillInsightsCards.jsx";
import PaycheckBreakdown from "../analytics/PaycheckBreakdown.jsx";
import WealthAnalyticsSection from "../analytics/WealthAnalyticsSection.jsx";
import ProfileNetWorthSection from "../profile/ProfileNetWorthSection.jsx";
import {
  AssetsInsightCard,
  InstrumentsInsightCard,
  LiabilitiesInsightCard,
} from "../analytics/InsightCardContent.jsx";
import { yearlyBurdenFromCommitments } from "../../../engines/analyticsSeries.js";
import { formatInr } from "../../../constants/symbols.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { useInsightsData } from "./useInsightsData.js";

function InsightsBreakdownShell({ titleKey, subtitleKey, children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="ct-page pb-8">
      <SubPageHeader
        title={t(titleKey)}
        subtitle={subtitleKey ? t(subtitleKey) : undefined}
        onBack={() => navigate("/insights")}
      />
      <div className="ct-stack px-4">{children}</div>
    </div>
  );
}

/** @route /insights/spending */
export function InsightsSpendingBreakdownPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const data = useInsightsData();

  return (
    <InsightsBreakdownShell titleKey="analytics.monthly.title" subtitleKey="analytics.monthly.subtitle">
      <MonthlySpendAnalyticsSection embedded>
        <BillInsightsCards />
      </MonthlySpendAnalyticsSection>
      {data.paycheckFlow ? (
        <PaycheckBreakdown
          breakdown={data.paycheckFlow}
          incomeStepLabel={data.incomeLabel}
          incomeEntryBasis={data.incomeEntryBasis}
          payerSplit={data.payerSplitForPaycheck}
          creditCard={data.cardPressureAnalytics}
        />
      ) : null}
      <AnalyticsChartPanel
        forecastSeries={data.forecastSeries}
        paymentsData={data.paymentsData}
        pressureTrend={data.pressureTrend}
        dailySpends={data.dailySpends}
      />
      <ViewLink label={t("analytics.viewSpendingHistory")} onClick={() => navigate("/ledger/spends")} />
    </InsightsBreakdownShell>
  );
}

/** @route /insights/spending/yearly */
export function InsightsYearlyBreakdownPage() {
  const { t } = useTranslation();
  const { commitments, dailySpends, getEffectiveStatus } = usePerovo();
  const { formatAmount } = usePrivacyAmount();
  const year = new Date().getFullYear();

  const yearlyBurden = useMemo(
    () => yearlyBurdenFromCommitments(commitments, getEffectiveStatus),
    [commitments, getEffectiveStatus],
  );

  const yearlyVariable = useMemo(() => {
    return (dailySpends || []).reduce((sum, row) => {
      const d = String(row.date || "");
      if (!d.startsWith(String(year))) return sum;
      return sum + (Number(row.amount) || 0);
    }, 0);
  }, [dailySpends, year]);

  const monthlyAvg = yearlyVariable > 0 ? yearlyVariable / Math.max(1, new Date().getMonth() + 1) : 0;

  return (
    <InsightsBreakdownShell titleKey="analytics.yearly.title" subtitleKey="analytics.yearly.subtitle">
      <div className="pos-tile liab">
        <p className="ct-stat-label">{t("analytics.yearly.burdenCard")}</p>
        <p className="ct-stat-value ct-numeral">{formatAmount(yearlyBurden)}</p>
        <p className="ct-caption mt-1">{t("analytics.yearly.burdenHint")}</p>
      </div>
      <div className="pos-tile inst">
        <p className="ct-stat-label">{t("analytics.yearly.variableCard")}</p>
        <p className="ct-stat-value ct-numeral">{formatAmount(yearlyVariable)}</p>
        <p className="ct-caption mt-1">
          {t("analytics.yearly.variableHint", { year, avg: formatInr(Math.round(monthlyAvg)) })}
        </p>
      </div>
      <div className="pos-tile agr">
        <p className="ct-stat-label">{t("analytics.yearly.combinedLabel")}</p>
        <p className="ct-stat-value ct-numeral">{formatAmount(yearlyBurden + yearlyVariable)}</p>
        <p className="ct-caption mt-1">{t("analytics.yearly.combinedHint")}</p>
      </div>
    </InsightsBreakdownShell>
  );
}

/** @route /insights/networth */
export function InsightsNetWorthBreakdownPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  if (tab === "assets") return <Navigate to="/insights/assets" replace />;
  if (tab === "liabilities") return <Navigate to="/insights/liabilities" replace />;
  if (tab === "instruments") return <Navigate to="/insights/instruments" replace />;

  return (
    <InsightsBreakdownShell titleKey="analytics.section.networth" subtitleKey="analytics.wealth.subtitle">
      <WealthAnalyticsSection
        showSimulation={false}
        showPressureAsLink
        ledgerSlot={<ProfileNetWorthSection />}
      />
      <div className="ct-row gap-2 flex-wrap">
        <button type="button" className="ct-btn ct-btn-ghost ct-btn-sm" onClick={() => navigate("/ledger?tab=assets")}>
          {t("ledger.tab.assets")}
        </button>
        <button type="button" className="ct-btn ct-btn-ghost ct-btn-sm" onClick={() => navigate("/ledger?tab=liabilities")}>
          {t("ledger.tab.liabilities")}
        </button>
        <button type="button" className="ct-btn ct-btn-ghost ct-btn-sm" onClick={() => navigate("/ledger?tab=instruments")}>
          {t("ledger.tab.instruments")}
        </button>
      </div>
    </InsightsBreakdownShell>
  );
}

/** @route /insights/cashflow */
export function InsightsCashflowBreakdownPage() {
  const data = useInsightsData();

  return (
    <InsightsBreakdownShell titleKey="analytics.insightCard.cashflow" subtitleKey="analytics.section.stabilityHint">
      <AnalyticsChartPanel
        forecastSeries={data.forecastSeries}
        paymentsData={data.paymentsData}
        pressureTrend={data.pressureTrend}
        dailySpends={data.dailySpends}
      />
    </InsightsBreakdownShell>
  );
}

/** @route /insights/pulse */
export function InsightsPulseBreakdownPage() {
  return (
    <InsightsBreakdownShell titleKey="analytics.insightCard.pulse" subtitleKey="analytics.section.stabilityHint">
      <FinancialPulseCard />
    </InsightsBreakdownShell>
  );
}

/** @route /insights/assets */
export function InsightsAssetsBreakdownPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <InsightsBreakdownShell
      titleKey="analytics.insightCard.assets"
      subtitleKey="analytics.insightAssets.breakdownSubtitle"
    >
      <div className="pos-tile asset">
        <AssetsInsightCard hideBreakdown />
      </div>
      <ViewLink label={t("ledger.tab.assets")} onClick={() => navigate("/ledger?tab=assets")} />
    </InsightsBreakdownShell>
  );
}

/** @route /insights/liabilities */
export function InsightsLiabilitiesBreakdownPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <InsightsBreakdownShell
      titleKey="analytics.insightCard.liabilities"
      subtitleKey="analytics.insightLiabilities.breakdownSubtitle"
    >
      <div className="pos-tile liab">
        <LiabilitiesInsightCard hideBreakdown />
      </div>
      <div className="ct-row gap-2 flex-wrap">
        <ViewLink label={t("ledger.tab.liabilities")} onClick={() => navigate("/ledger?tab=liabilities")} />
        <ViewLink label={t("ledger.headerBills")} onClick={() => navigate("/ledger/bills")} />
      </div>
    </InsightsBreakdownShell>
  );
}

/** @route /insights/instruments */
export function InsightsInstrumentsBreakdownPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <InsightsBreakdownShell
      titleKey="analytics.insightCard.instruments"
      subtitleKey="analytics.insightInstruments.breakdownSubtitle"
    >
      <div className="pos-tile inst">
        <InstrumentsInsightCard hideBreakdown showHoldings />
      </div>
      <ViewLink label={t("ledger.tab.instruments")} onClick={() => navigate("/ledger?tab=instruments")} />
    </InsightsBreakdownShell>
  );
}
