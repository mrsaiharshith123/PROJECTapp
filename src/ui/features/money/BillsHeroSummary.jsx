import { useMemo } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";

/**
 * Bills hero — committed total + paid/pending/overdue bar.
 * @param {{ activeBills: object[], counts: { overdue?: number, pending?: number } }} props
 */
export default function BillsHeroSummary({ activeBills, counts }) {
  const { t } = useTranslation();

  const { total, paidAmt, pendingAmt, overdueAmt } = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    for (const bill of activeBills) {
      const amt = Number(bill.amount) || 0;
      const st = bill.effectiveStatus;
      if (st === "paid") paid += amt;
      else if (st === "overdue") overdue += amt;
      else pending += amt;
    }
    return {
      total: paid + pending + overdue,
      paidAmt: paid,
      pendingAmt: pending,
      overdueAmt: overdue,
    };
  }, [activeBills]);

  if (activeBills.length <= 1) return null;

  const paidPct = total > 0 ? (paidAmt / total) * 100 : 0;
  const pendingPct = total > 0 ? (pendingAmt / total) * 100 : 0;
  const overduePct = total > 0 ? (overdueAmt / total) * 100 : 0;
  const overdueCount = counts.overdue || 0;

  return (
    <div className="ct-hero-card lending ct-money-bills-hero">
      <p className="ct-hero-label">{t("money.bills.committedLabel")}</p>
      <p className="ct-money-hero-amount">{formatInr(total)}</p>
      <div className="ct-money-commit-bar" aria-hidden>
        {paidPct > 0 ? (
          <span className="ct-money-commit-seg paid" style={{ width: `${paidPct}%` }} />
        ) : null}
        {pendingPct > 0 ? (
          <span className="ct-money-commit-seg pending" style={{ width: `${pendingPct}%` }} />
        ) : null}
        {overduePct > 0 ? (
          <span className="ct-money-commit-seg overdue" style={{ width: `${overduePct}%` }} />
        ) : null}
      </div>
      <p className="ct-money-hero-sub">
        {t("money.bills.summaryMeta", {
          count: activeBills.length,
          overdue: overdueCount,
        })}
      </p>
    </div>
  );
}
