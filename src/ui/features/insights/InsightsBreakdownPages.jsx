import { useMemo } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import FinancialPulseCard from "../dashboard/FinancialPulseCard.jsx";
import AnalyticsChartPanel from "../analytics/AnalyticsChartPanel.jsx";
import WealthAnalyticsSection from "../analytics/WealthAnalyticsSection.jsx";
import ProfileNetWorthSection from "../profile/ProfileNetWorthSection.jsx";
import { yearlyBurdenFromCommitments } from "../../../engines/analyticsSeries.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { useInsightsData } from "./useInsightsData.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import {
  isCoreAssetEntry,
  isInstrumentWealthEntry,
  isInstrumentCommitment,
} from "../../../utils/ledger/ledgerBuckets.js";
import { computeAssetCagr } from "../../../utils/netWorth/physicalAssetHelpers.js";
import { ASSET_CATEGORIES } from "../../../constants/netWorth/wealthCategories.js";

function wealthCategoryLabel(t, categoryId) {
  const def = ASSET_CATEGORIES.find((c) => c.id === categoryId);
  return def ? t(def.labelKey) : categoryId;
}

function InsightsBreakdownShell({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="ct-page ed-paper ed-ins-page">
      <div className="ed-ins-sub-mast">
        <button type="button" className="ed-ins-back" onClick={() => navigate("/insights")}>
          {t("insights.subpages.back")}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="ed-ins-sub-title">{title}</h1>
          {subtitle ? <p className="ed-ins-sub-sub">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function billStatusLabel(t, status) {
  const key = `bill.status.${status}`;
  const translated = t(key);
  return translated !== key ? translated : status;
}

/** @route /insights/spending */
export function InsightsSpendingBreakdownPage() {
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
              <div key={c.id} className="ed-ins-row" style={{ cursor: "default" }}>
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
export function InsightsYearlyBreakdownPage() {
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
export function InsightsNetWorthBreakdownPage() {
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
export function InsightsCashflowBreakdownPage() {
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
export function InsightsPulseBreakdownPage() {
  const { t } = useTranslation();

  return (
    <InsightsBreakdownShell
      title={t("analytics.insightCard.pulse")}
      subtitle={t("insights.subpages.pulseSubtitle")}
    >
      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <FinancialPulseCard />
      </div>
    </InsightsBreakdownShell>
  );
}

/** @route /insights/assets */
export function InsightsAssetsBreakdownPage() {
  const navigate = useNavigate();
  const { entries, core } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();
  const { t } = useTranslation();

  const assetEntries = useMemo(() => entries.filter((e) => isCoreAssetEntry(e)), [entries]);
  const totalAssets = core?.totalAssets ?? 0;

  const withCagr = useMemo(
    () =>
      assetEntries
        .map((e) => {
          const cagr = computeAssetCagr(e.purchasePrice, e.purchaseYear, e.value);
          const yearsHeld = e.purchaseYear ? new Date().getFullYear() - e.purchaseYear : null;
          return { ...e, cagr, yearsHeld };
        })
        .sort((a, b) => (b.value || 0) - (a.value || 0)),
    [assetEntries],
  );

  return (
    <InsightsBreakdownShell
      title={t("insights.subpages.assetsTitle")}
      subtitle={t("insights.subpages.assetsSubtitle")}
    >
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.subpages.totalAssetsKicker")}</div>
        <div className="ed-ins-bignum" style={{ marginBottom: 4 }}>
          {formatAmount(totalAssets)}
        </div>
        <p className="ed-ins-body">
          {assetEntries.length === 1
            ? t("insights.subpages.assetCountOne")
            : t("insights.subpages.assetCount", { count: assetEntries.length })}
        </p>
      </div>

      {withCagr.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.allHoldings")}</div>
          {withCagr.map((e) => (
            <div key={e.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">
                  {e.categoryId || t("ledger.tab.assets")}
                  {e.cagr != null && e.yearsHeld != null
                    ? ` · ${t("insights.subpages.cagrYearsHeld", {
                        cagr: e.cagr.toFixed(1),
                        years: e.yearsHeld,
                      })}`
                    : null}
                </div>
                <div className="ed-ins-row-name">{e.name}</div>
                {e.aiInsight ? (
                  <div className="ed-ins-row-sub">
                    {e.aiInsight.split("VERDICT:")[1]?.split("\n")[0]?.trim() ||
                      e.aiInsight.slice(0, 80)}
                  </div>
                ) : null}
              </div>
              <div className="ed-ins-row-val" style={{ color: "var(--ed-green)" }}>
                {formatAmount(e.value || 0)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ed-ins-story">
          <p className="ed-ins-empty">{t("insights.subpages.noAssets")}</p>
        </div>
      )}

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0 }}
          onClick={() => navigate("/ledger?tab=assets")}
        >
          {t("insights.subpages.viewAssetsLedger")}
        </button>
      </div>
    </InsightsBreakdownShell>
  );
}

const LOAN_CATEGORIES = new Set([
  "Home Loan",
  "Car Loan",
  "EMI",
  "Personal Loan",
  "Credit Card",
  "Loan",
]);

/** @route /insights/liabilities */
export function InsightsLiabilitiesBreakdownPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sortedCommitments, getEffectiveStatus } = usePerovo();
  const { entries, core } = useNetWorth();
  const { formatAmount } = usePrivacyAmount();

  const emiCommitments = useMemo(
    () =>
      sortedCommitments
        .filter((c) => LOAN_CATEGORIES.has(c.category || ""))
        .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0)),
    [sortedCommitments],
  );
  const totalEmi = emiCommitments.reduce((s, c) => s + Number(c.amount || 0), 0);

  const liabEntries = useMemo(() => entries.filter((e) => e.kind === "liability"), [entries]);
  const totalDebt = core?.totalLiabilities ?? 0;

  const overdueBills = useMemo(
    () =>
      sortedCommitments
        .filter((c) => getEffectiveStatus(c) === "overdue")
        .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0)),
    [sortedCommitments, getEffectiveStatus],
  );

  return (
    <InsightsBreakdownShell
      title={t("insights.subpages.liabilitiesTitle")}
      subtitle={t("insights.subpages.liabilitiesSubtitle")}
    >
      <div className="ed-ins-story">
        <div className="ed-ins-kicker">{t("insights.subpages.debtOverview")}</div>
        <div className="ed-ins-cols">
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("insights.subpages.totalDebtLabel")}</span>
            <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
              {formatAmount(totalDebt)}
            </span>
          </div>
          <div className="ed-ins-col">
            <span className="ed-ins-col-label">{t("analytics.insightLiabilities.monthlyEmi")}</span>
            <span className="ed-ins-col-val" style={{ color: "var(--ed-red)" }}>
              {formatAmount(totalEmi)}
            </span>
          </div>
        </div>
      </div>

      {overdueBills.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.overdueActNow")}</div>
          {overdueBills.map((c) => (
            <div key={c.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-name">{getBillDisplayName(c)}</div>
                <div className="ed-ins-row-sub">{c.category}</div>
              </div>
              <div className="ed-ins-row-val danger">{formatAmount(Number(c.amount || 0))}</div>
            </div>
          ))}
        </div>
      ) : null}

      {emiCommitments.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.emiLoans")}</div>
          {emiCommitments.map((c) => {
            const remaining =
              c.totalInstallments && c.paidInstallments
                ? c.totalInstallments - c.paidInstallments
                : null;
            return (
              <div key={c.id} className="ed-ins-row" style={{ cursor: "default" }}>
                <div className="ed-ins-row-left">
                  <div className="ed-ins-row-name">{getBillDisplayName(c)}</div>
                  <div className="ed-ins-row-sub">
                    {remaining != null
                      ? t("insights.subpages.installmentsLeft", { count: remaining })
                      : c.category}
                  </div>
                </div>
                <div className="ed-ins-row-val">
                  {formatAmount(Number(c.amount || 0))}/mo
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {liabEntries.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.recordedLiabilities")}</div>
          {liabEntries.map((e) => (
            <div key={e.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-name">{e.name}</div>
              </div>
              <div className="ed-ins-row-val" style={{ color: "var(--ed-red)" }}>
                {formatAmount(e.value || 0)}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {emiCommitments.length === 0 && liabEntries.length === 0 ? (
        <div className="ed-ins-story">
          <p className="ed-ins-empty">{t("insights.subpages.noDebt")}</p>
        </div>
      ) : null}

      <div className="ed-ins-story" style={{ borderBottom: "none" }}>
        <button
          type="button"
          className="ed-ins-link"
          style={{ padding: 0 }}
          onClick={() => navigate("/ledger/bills")}
        >
          {t("insights.subpages.manageBills")}
        </button>
      </div>
    </InsightsBreakdownShell>
  );
}

/** @route /insights/instruments */
export function InsightsInstrumentsBreakdownPage() {
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
            <span className="ed-ins-col-val" style={{ color: "var(--ed-violet)" }}>
              {formatAmount(totalValue)}
            </span>
          </div>
          {monthlySip > 0 ? (
            <div className="ed-ins-col">
              <span className="ed-ins-col-label">{t("analytics.insightInstruments.monthlySip")}</span>
              <span className="ed-ins-col-val" style={{ color: "var(--ed-violet)" }}>
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
            <div key={c.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">{c.dueDate}</div>
                <div className="ed-ins-row-name">{getBillDisplayName(c)}</div>
              </div>
              <div className="ed-ins-row-val" style={{ color: "var(--ed-violet)" }}>
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
            <div key={e.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-name">{e.name}</div>
                <div className="ed-ins-row-sub">{wealthCategoryLabel(t, e.categoryId)}</div>
              </div>
              <div className="ed-ins-row-val" style={{ color: "var(--ed-violet)" }}>
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
            <div key={c.id} className="ed-ins-row" style={{ cursor: "default" }}>
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
