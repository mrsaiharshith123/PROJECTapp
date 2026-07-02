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

export default function InsightsYearlyBreakdownPage() {
  const { t } = useTranslation();
  const { commitments, dailySpends, getEffectiveStatus } = usePerovo();
  const { formatAmount } = usePrivacyAmount();
  const year = new Date().getFullYear();

  const yearlyBurden = useMemo(
    () => yearlyBurdenFromCommitments(commitments, getEffectiveStatus),
    [commitments, getEffectiveStatus],
  );

  const yearlyVariable = useMemo(
    () =>
      (dailySpends || []).reduce((sum, row) => {
        const d = String(row.date || "");
        if (!d.startsWith(String(year))) return sum;
        return sum + (Number(row.amount) || 0);
      }, 0),
    [dailySpends, year],
  );

  const monthlyAvg =
    yearlyVariable > 0 ? yearlyVariable / Math.max(1, new Date().getMonth() + 1) : 0;

  const byCatYearly = useMemo(() => {
    const map = {};
    for (const c of commitments) {
      const cat = c.category || "Other";
      map[cat] = (map[cat] || 0) + Number(c.amount || 0) * 12;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [commitments]);

  return (
    <InsightsBreakdownShell
      title={t("analytics.yearly.title")}
      subtitle={t("insights.subpages.yearlySubtitle", { year })}
    >
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.subpages.annualTotals")}</div>
        <div className="ed-ins-row" style={{ cursor: "default" }}>
          <div className="ed-ins-row-left">
            <div className="ed-ins-row-cat">{t("analytics.yearly.burdenCard")}</div>
            <div className="ed-ins-row-name">{t("insights.subpages.recurringBillsEmi")}</div>
          </div>
          <div className="ed-ins-row-val">{formatAmount(yearlyBurden)}</div>
        </div>
        <div className="ed-ins-row" style={{ cursor: "default" }}>
          <div className="ed-ins-row-left">
            <div className="ed-ins-row-cat">{t("analytics.yearly.variableCard")}</div>
            <div className="ed-ins-row-name">
              {t("insights.subpages.monthlyAvg", {
                amount: formatAmount(Math.round(monthlyAvg)),
              })}
            </div>
          </div>
          <div className="ed-ins-row-val">{formatAmount(yearlyVariable)}</div>
        </div>
        <div className="ed-ins-row" style={{ borderBottom: "none", cursor: "default" }}>
          <div className="ed-ins-row-left">
            <div className="ed-ins-row-cat">{t("insights.subpages.totalOutflowYear")}</div>
            <div className="ed-ins-row-name">{t("insights.subpages.billsPlusVariable")}</div>
          </div>
          <div className="ed-ins-row-val" style={{ color: "var(--ed-red)" }}>
            {formatAmount(yearlyBurden + yearlyVariable)}
          </div>
        </div>
      </div>

      {byCatYearly.length > 0 ? (
        <div className="ed-ins-story" style={{ borderBottom: "none" }}>
          <div className="ed-ins-kicker">{t("insights.subpages.billsByCategoryAnnual")}</div>
          {byCatYearly.map(([cat, total]) => (
            <div key={cat} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-name">{cat}</div>
              </div>
              <div className="ed-ins-row-val">{formatAmount(total)}</div>
            </div>
          ))}
        </div>
      ) : null}
    </InsightsBreakdownShell>
  );
}

/** @route /insights/networth */
