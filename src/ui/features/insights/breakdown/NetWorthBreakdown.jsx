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

export default function InsightsNetWorthBreakdownPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab");
  if (tab === "assets") return <Navigate to="/insights/assets" replace />;
  if (tab === "liabilities") return <Navigate to="/insights/liabilities" replace />;
  if (tab === "instruments") return <Navigate to="/insights/instruments" replace />;

  return (
    <InsightsBreakdownShell
      title={t("insights.subpages.networthTitle")}
      subtitle={t("analytics.wealth.subtitle")}
    >
      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <WealthAnalyticsSection
          showSimulation={false}
          showPressureAsLink
          ledgerSlot={<ProfileNetWorthSection />}
        />
      </div>
      <div className="ed-ins-story" style={{ borderBottom: "none", display: "flex", gap: 16 }}>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0 }}
          onClick={() => navigate("/insights/assets")}
        >
          {t("insights.subpages.assetsLink")}
        </button>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0 }}
          onClick={() => navigate("/insights/liabilities")}
        >
          {t("insights.subpages.liabilitiesLink")}
        </button>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0 }}
          onClick={() => navigate("/insights/instruments")}
        >
          {t("insights.subpages.instrumentsLink")}
        </button>
      </div>
    </InsightsBreakdownShell>
  );
}

/** @route /insights/cashflow */
