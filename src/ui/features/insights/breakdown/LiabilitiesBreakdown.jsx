import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import { usePrivacyAmount } from "../../../../hooks/usePrivacyAmount.js";
import { getBillDisplayName } from "../../../../utils/billDisplayName.js";
import {
  InsightsBreakdownShell,
  openBillDetail,
  openWealthDetail,
  rowButtonProps,
} from "./_shared.jsx";

const LOAN_CATEGORIES = new Set(["EMI", "Loan", "Credit Card", "BNPL"]);

export default function InsightsLiabilitiesBreakdownPage() {
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
            <div
              key={c.id}
              className="ed-ins-row"
              {...rowButtonProps(() => openBillDetail({ navigate, billId: c.id }))}
            >
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
              <div
                key={c.id}
                className="ed-ins-row"
                {...rowButtonProps(() => openBillDetail({ navigate, billId: c.id }))}
              >
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
            <div
              key={e.id}
              className="ed-ins-row"
              {...rowButtonProps(() => openWealthDetail({ navigate, entryId: e.id }))}
            >
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
