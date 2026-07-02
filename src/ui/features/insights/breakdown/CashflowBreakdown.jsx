import { useMemo } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import FinancialPulseCard from "../../dashboard/FinancialPulseCard.jsx";
import AnalyticsChartPanel from "../../analytics/AnalyticsChartPanel.jsx";
import WealthAnalyticsSection from "../../analytics/WealthAnalyticsSection.jsx";
import ProfileNetWorthSection from "../../profile/ProfileNetWorthSection.jsx";
import { yearlyBurdenFromCommitments } from "../../../../engines/analyticsSeries.js";
import { usePrivacyAmount } from "../../../../hooks/usePrivacyAmount.js";
import { useInsightsData } from "../useInsightsData.js";
import { getBillDisplayName } from "../../../../utils/billDisplayName.js";
import {
  isCoreAssetEntry,
  isInstrumentWealthEntry,
  isInstrumentCommitment,
} from "../../../../utils/ledger/ledgerBuckets.js";
import { computeAssetCagr } from "../../../../utils/netWorth/physicalAssetHelpers.js";
import {
  InsightsBreakdownShell,
  billStatusLabel,
  openBillDetail,
  openWealthDetail,
  wealthCategoryLabel,
  ROW_CLICK,
} from "./_shared.jsx";

export default function InsightsCashflowBreakdownPage() {
  const { t } = useTranslation();
  const data = useInsightsData();
  const { sortedCommitments, todayStr } = usePerovo();
  const { formatAmount } = usePrivacyAmount();

  const upcoming30 = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const today = todayStr || new Date().toISOString().slice(0, 10);
    return sortedCommitments
      .filter((c) => c.dueDate && c.dueDate >= today && c.dueDate <= cutoffStr)
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
      .slice(0, 8);
  }, [sortedCommitments, todayStr]);

  return (
    <InsightsBreakdownShell
      title={t("analytics.insightCard.cashflow")}
      subtitle={t("insights.subpages.cashflowSubtitle")}
    >
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.subpages.cashflowForecast")}</div>
        <AnalyticsChartPanel
          forecastSeries={data.forecastSeries}
          paymentsData={data.paymentsData}
          pressureTrend={data.pressureTrend}
          dailySpends={data.dailySpends}
        />
      </div>

      {upcoming30.length > 0 ? (
        <div className="ed-ins-story" style={{ borderBottom: "none" }}>
          <div className="ed-ins-kicker">{t("insights.subpages.dueNext30")}</div>
          {upcoming30.map((c) => (
            <div key={c.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">{c.dueDate}</div>
                <div className="ed-ins-row-name">{getBillDisplayName(c)}</div>
              </div>
              <div className="ed-ins-row-val">{formatAmount(Number(c.amount || 0))}</div>
            </div>
          ))}
        </div>
      ) : null}
    </InsightsBreakdownShell>
  );
}

/** @route /insights/pulse */
