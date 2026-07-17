import { useMemo } from "react";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { usePrivacyAmount } from "../../../../hooks/usePrivacyAmount.js";
import { useInsightsData } from "../useInsightsData.js";
import { getBillDisplayName } from "../../../../utils/billDisplayName.js";
import { InsightsBreakdownShell } from "./_shared.jsx";

export default function InsightsSpendingBreakdownPage() {
  const { t } = useTranslation();
  const data = useInsightsData();
  const { sortedCommitments, getEffectiveStatus } = usePerovo();
  const { formatAmount } = usePrivacyAmount();

  const paycheckRows = data.paycheckFlow
    ? [
        {
          label: data.incomeLabel || t("analytics.freeCashRemaining"),
          val: data.paycheckFlow.income,
        },
        {
          label: t("analytics.recurringBills"),
          val: data.paycheckFlow.recurringMonthly ?? data.paycheckFlow.fixedMonthly,
        },
        {
          label: t("analytics.freeCashRemaining"),
          val: data.paycheckFlow.freeCash,
        },
      ].filter((r) => r.val != null)
    : [];

  const byCategory = useMemo(() => {
    const map = {};
    for (const c of sortedCommitments) {
      const status = getEffectiveStatus(c);
      if (status === "paid" || status === "upnext") continue;
      const cat = c.category || "Other";
      map[cat] = (map[cat] || 0) + Number(c.amount ?? 0);
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [sortedCommitments, getEffectiveStatus]);

  const categoryTotal = byCategory.reduce((s, [, amt]) => s + amt, 0);

  const activeBills = useMemo(
    () =>
      sortedCommitments
        .filter((c) => {
          const status = getEffectiveStatus(c);
          return status !== "paid" && status !== "upnext";
        })
        .sort((a, b) => Number(b.amount ?? 0) - Number(a.amount ?? 0))
        .slice(0, 10),
    [sortedCommitments, getEffectiveStatus],
  );

  return (
    <InsightsBreakdownShell
      title={t("insights.subpages.spendingTitle")}
      subtitle={t("insights.subpages.spendingSubtitle")}
    >
      {paycheckRows.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.editorial.paycheckKicker")}</div>
          {paycheckRows.map((row) => (
            <div key={row.label} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-name">{row.label}</div>
              </div>
              <div className="ed-ins-row-val">{formatAmount(row.val)}</div>
            </div>
          ))}
        </div>
      ) : null}

      {byCategory.length > 0 ? (
        <div className="ed-ins-story">
          <div className="ed-ins-kicker">{t("insights.subpages.spendingByCategory")}</div>
          {byCategory.map(([cat, amt]) => (
            <div key={cat} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left" style={{ flex: 1 }}>
                <div className="ed-ins-row-name">{cat}</div>
                {categoryTotal > 0 ? (
                  <div className="ed-ins-row-sub">{`${Math.round((amt / categoryTotal) * 100)}%`}</div>
                ) : null}
              </div>
              <div className="ed-ins-row-val">{formatAmount(amt)}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="ed-ins-empty">{t("insights.editorial.spendingEmpty")}</p>
      )}

      {activeBills.length > 0 ? (
        <div className="ed-ins-story" style={{ borderBottom: "none" }}>
          <div className="ed-ins-kicker">{t("insights.subpages.spendingLargestBills")}</div>
          {activeBills.map((c) => (
            <div key={c.id} className="ed-ins-row" style={{ cursor: "default" }}>
              <div className="ed-ins-row-left">
                <div className="ed-ins-row-cat">{c.category || t("insights.editorial.billFallback")}</div>
                <div className="ed-ins-row-name">{getBillDisplayName(c)}</div>
              </div>
              <div className="ed-ins-row-val">{formatAmount(Number(c.amount ?? 0))}</div>
            </div>
          ))}
        </div>
      ) : null}
    </InsightsBreakdownShell>
  );
}
