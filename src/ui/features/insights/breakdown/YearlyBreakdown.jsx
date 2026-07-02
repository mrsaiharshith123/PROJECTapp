import { useMemo } from "react";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { usePrivacyAmount } from "../../../../hooks/usePrivacyAmount.js";
import { yearlyBurdenFromCommitments } from "../../../../engines/analyticsSeries.js";
import { InsightsBreakdownShell } from "./_shared.jsx";

export default function InsightsYearlyBreakdownPage() {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus } = usePerovo();
  const { formatAmount } = usePrivacyAmount();
  const year = new Date().getFullYear();

  const yearlyBurden = useMemo(
    () => yearlyBurdenFromCommitments(commitments, getEffectiveStatus),
    [commitments, getEffectiveStatus],
  );

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
