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

export default function InsightsSpendingBreakdownPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const data = useInsightsData();
  const { sortedCommitments, getEffectiveStatus } = usePerovo();
  const { formatAmount } = usePrivacyAmount();

  const allBills = useMemo(
    () => [...sortedCommitments].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0)),
    [sortedCommitments],
  );

  const byCategory = useMemo(() => {
    const map = {};
    for (const c of sortedCommitments) {
      const cat = c.category || "Other";
      map[cat] = (map[cat] || 0) + Number(c.amount || 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [sortedCommitments]);

  const variableSpend =
    data.paycheckFlow?.loggedSpendThisMonth ?? data.paycheckFlow?.variableMonthly ?? 0;
  const freeCash = data.paycheckFlow?.freeCash ?? data.paycheckFlow?.freeMoney ?? 0;

  return (
    <InsightsBreakdownShell
      title={t("analytics.monthly.title")}
      subtitle={t("analytics.monthly.subtitle")}
    >
      {data.paycheckFlow && data.paycheckFlow.income > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.paycheckFlowKicker")}</div>
          <div className="ed-ins-waterfall">
            <div className="ed-ins-waterfall-step">
              <span className="ed-ins-waterfall-label">
                {data.incomeLabel || t("analytics.freeCashRemaining")}
              </span>
              <span className="ed-ins-waterfall-val income">{formatAmount(data.paycheckFlow.income)}</span>
            </div>
            <div className="ed-ins-waterfall-step">
              <span className="ed-ins-waterfall-label">{t("analytics.recurringBills")}</span>
              <span className="ed-ins-waterfall-val deduct">
                −{" "}
                {formatAmount(
                  data.paycheckFlow.recurringMonthly ?? data.paycheckFlow.fixedMonthly ?? 0,
                )}
              </span>
            </div>
            {variableSpend > 0 ? (
              <div className="ed-ins-waterfall-step">
                <span className="ed-ins-waterfall-label">{t("analytics.variableLoggedSpend")}</span>
                <span className="ed-ins-waterfall-val deduct">− {formatAmount(variableSpend)}</span>
              </div>
            ) : null}
            <div className="ed-ins-waterfall-step">
              <span className="ed-ins-waterfall-label" style={{ fontWeight: 600 }}>
                {t("home.ed.statFree")}
              </span>
              <span className="ed-ins-waterfall-val free">{formatAmount(freeCash)}</span>
            </div>
          </div>
        </div>
      ) : null}

      {byCategory.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.byCategory")}</div>
          {byCategory.map(([cat, total]) => (
            <div key={cat} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-name">{cat}</div>
              </div>
              <div className="ed-ins-row-val">{formatAmount(total)}</div>
            </div>
          ))}
        </div>
      ) : null}

      {allBills.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.allBillsMonth")}</div>
          {allBills.map((c) => {
            const status = getEffectiveStatus(c);
            return (
              <div
                key={c.id}
                className="ed-ins-row"
                {...rowButtonProps(() => openBillDetail({ navigate, billId: c.id }))}
              >
                <div className="ed-ins-row-left">
                  <div className="ed-ins-row-name">{getBillDisplayName(c)}</div>
                  {c.category ? <div className="ed-ins-row-sub">{c.category}</div> : null}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span className={`ed-ins-status ${status}`}>{billStatusLabel(t, status)}</span>
                  <span className="ed-ins-row-val">{formatAmount(Number(c.amount || 0))}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ed-ins-story">
          <p className="ed-ins-empty">{t("insights.subpages.noBills")}</p>
        </div>
      )}

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0 }}
          onClick={() => navigate("/ledger/spends")}
        >
          {t("analytics.viewSpendingHistory")}
        </button>
      </div>
    </InsightsBreakdownShell>
  );
}

/** @route /insights/spending/yearly */
