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
  rowButtonProps,
} from "./_shared.jsx";

export default function InsightsInstrumentsBreakdownPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sortedCommitments } = usePerovo();
  const { entries } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();

  const instrumentEntries = useMemo(
    () => entries.filter(isInstrumentWealthEntry),
    [entries],
  );
  const instrCommitments = useMemo(
    () => sortedCommitments.filter(isInstrumentCommitment),
    [sortedCommitments],
  );

  const totalValue = instrumentEntries.reduce((s, e) => s + Number(e.value || 0), 0);
  const monthlySip = instrCommitments.reduce((s, c) => s + Number(c.amount || 0), 0);

  const sipItems = instrCommitments.filter((c) => c.category === "SIP");
  const upcoming = [...instrCommitments]
    .filter((c) => c.dueDate)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  return (
    <InsightsBreakdownShell
      title={t("analytics.insightCard.instruments")}
      subtitle={t("insights.subpages.instrumentsSubtitle")}
    >
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.subpages.overview")}</div>
        <div className="ed-ins-cols">
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("insights.subpages.totalValue")}</span>
            <span className="ed-ins-col-val" style={{ color: "var(--ed-gold)" }}>
              {formatAmount(totalValue)}
            </span>
          </div>
          {monthlySip > 0 ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("analytics.insightInstruments.monthlySip")}</span>
              <span className="ed-ins-col-val" style={{ color: "var(--ed-gold)" }}>
                {formatAmount(monthlySip)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {upcoming.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.upcomingMaturities")}</div>
          {upcoming.slice(0, 5).map((c) => (
            <div
              key={c.id}
              className="ed-ins-row"
              {...rowButtonProps(() => openBillDetail({ navigate, billId: c.id }))}
            >
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">{c.dueDate}</div>
                <div className="ed-ins-row-name">{getBillDisplayName(c)}</div>
              </div>
              <div className="ed-ins-row-val" style={{ color: "var(--ed-gold)" }}>
                {formatAmount(Number(c.amount || 0))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {instrumentEntries.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.allHoldings")}</div>
          {instrumentEntries.map((e) => (
            <div
              key={e.id}
              className="ed-ins-row"
              {...rowButtonProps(() => openWealthDetail({ navigate, entryId: e.id }))}
            >
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-name">{e.name}</div>
                <div className="ed-ins-row-sub">{wealthCategoryLabel(t, e.categoryId)}</div>
              </div>
              <div className="ed-ins-row-val" style={{ color: "var(--ed-gold)" }}>
                {formatAmount(e.value || 0)}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {sipItems.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.monthlySipPlans")}</div>
          {sipItems.map((c) => (
            <div
              key={c.id}
              className="ed-ins-row"
              {...rowButtonProps(() => openBillDetail({ navigate, billId: c.id }))}
            >
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-name">{getBillDisplayName(c)}</div>
              </div>
              <div className="ed-ins-row-val">{formatAmount(Number(c.amount || 0))}/mo</div>
            </div>
          ))}
        </div>
      ) : null}

      {instrumentEntries.length === 0 && instrCommitments.length === 0 ? (
        <div className="ed-ins-story">
          <p className="ed-ins-empty">{t("insights.subpages.noInstruments")}</p>
        </div>
      ) : null}

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0 }}
          onClick={() => navigate("/ledger?tab=instruments")}
        >
          {t("insights.subpages.viewInstrumentsLedger")}
        </button>
      </div>
    </InsightsBreakdownShell>
  );
}

