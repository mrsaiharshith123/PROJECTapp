import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../i18n/insightLabels.js";
import { isActiveBill } from "../../../utils/billLifecycle.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { daysUntil } from "../../../utils/dates.js";

/** Short label for attention rows — insurer name only, not full policy string. */
function attentionBillTitle(commitment) {
  if (commitment.category === "Insurance") {
    const company = String(commitment.insuranceCompany || "").trim();
    if (company) return company.length > 26 ? `${company.slice(0, 24)}…` : company;
    const id = String(commitment.insurancePolicyId || "").trim();
    if (id) return `Insurance · ${id.length > 8 ? id.slice(-8) : id}`;
  }
  const full = getBillDisplayName(commitment);
  return full.length > 28 ? `${full.slice(0, 26)}…` : full;
}

function insightKicker(insight, t) {
  if (insight.id === "free-cash-low") return t("home.ed.attention.lowCashKick");
  if (insight.id?.startsWith("burden") || insight.id?.includes("pressure") || insight.id?.includes("emi")) {
    return t("home.ed.attention.pressureKick");
  }
  return t("home.ed.attention.alertKick");
}

function AttentionRow({ item, navigate, formatAmount, t, primary = false }) {
  const isOverdue = item.overdue;
  const tone = item.tone || (isOverdue ? "danger" : "warning");
  const kickerText =
    item.kicker ||
    (isOverdue ? t("home.ed.attention.overdueKick") : t("home.ed.attention.dueSoonKick"));

  return (
    <button
      type="button"
      className={`ed-break${primary ? " ed-break--primary" : ""}`}
      onClick={() => navigate(item.to)}
    >
      <span className={`ed-break-no ${tone}`}>!</span>
      <div className="ed-break-body">
        <div className={`ed-break-kick ${tone}`}>{kickerText}</div>
        <div className="ed-break-head">{item.name}</div>
        {item.statusText ? <div className="ed-break-sub">{item.statusText}</div> : null}
        {primary ? <span className="ed-break-cta">{t("home.ed.attention.primaryCta")}</span> : null}
      </div>
      {item.amount != null ? (
        <span className={`ed-break-amt ${tone}`}>{formatAmount(item.amount)}</span>
      ) : null}
    </button>
  );
}

export default function HomeNeedsAttention() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sortedCommitments, lendings, getEffectiveStatus, todayStr } = usePerovo();
  const { insights } = useCommitIntel();
  const { formatAmount } = usePrivacyAmount();

  const { overdueAll, dueSoonAll, intelAll } = useMemo(() => {
    /** @type {object[]} */
    const overdueRows = [];
    /** @type {object[]} */
    const dueSoonRows = [];

    for (const c of sortedCommitments) {
      if (!isActiveBill(c, getEffectiveStatus, todayStr)) continue;
      const status = getEffectiveStatus(c);
      if (status !== "overdue") continue;
      const daysLate = Math.max(1, -daysUntil(c.dueDate, todayStr));
      overdueRows.push({
        id: `bill-${c.id}`,
        name: attentionBillTitle(c),
        amount: Number(c.amount ?? 0),
        statusText: t("home.attention.overdueDays", { days: daysLate }),
        overdue: true,
        to: "/ledger/bills",
      });
    }

    for (const l of lendings) {
      if (l.type !== "lent") continue;
      for (const r of l.repaymentSchedule || []) {
        if (r.paymentStatus === "paid" || !r.dueDate) continue;
        const daysLate = differenceInCalendarDays(parseISO(todayStr), parseISO(r.dueDate));
        if (daysLate <= 0) continue;
        overdueRows.push({
          id: `lending-${l.id}-${r.dueDate}`,
          name: l.counterpartyName || l.personName || l.name || t("money.tab.lending"),
          amount: Number(r.amount ?? 0),
          statusText: t("home.attention.overdueDays", { days: daysLate }),
          overdue: true,
          to: "/money/lending",
        });
      }
    }

    for (const c of sortedCommitments) {
      if (!isActiveBill(c, getEffectiveStatus, todayStr)) continue;
      const status = getEffectiveStatus(c);
      if (status !== "pending") continue;
      const days = daysUntil(c.dueDate, todayStr);
      if (days < 0 || days > 3) continue;
      dueSoonRows.push({
        id: `bill-${c.id}`,
        name: attentionBillTitle(c),
        amount: Number(c.amount ?? 0),
        statusText: days === 0 ? t("home.dueSoon") : t("home.attention.dueInDays", { days }),
        overdue: false,
        to: "/ledger/bills",
      });
    }

    const intelRows = [];
    const hasOverdueBills = overdueRows.length > 0;
    for (const ins of insights) {
      if (ins.tone !== "critical" && ins.tone !== "warning") continue;
      if (hasOverdueBills && ins.id === "multi-overdue") continue;
      intelRows.push({
        id: `intel-${ins.id}`,
        name: translateInsight(t, ins),
        kicker: insightKicker(ins, t),
        tone: ins.tone === "critical" ? "danger" : "warning",
        to: "/insights",
      });
    }

    return { overdueAll: overdueRows, dueSoonAll: dueSoonRows, intelAll: intelRows };
  }, [sortedCommitments, lendings, getEffectiveStatus, todayStr, insights, t]);

  const overdue = overdueAll.slice(0, 2);
  const dueSoon = dueSoonAll.slice(0, overdue.length ? 2 : 3);
  const intel = intelAll.slice(0, 2);
  const rows = [...overdue, ...dueSoon, ...intel];
  const totalCount = overdueAll.length + dueSoonAll.length + intelAll.length;

  if (totalCount === 0) return null;

  const hasOverdue = overdue.length > 0;
  const sectionTitle =
    totalCount === 1
      ? t("home.ed.attention.sectionOne")
      : t("home.ed.attention.sectionMany", { count: totalCount });

  return (
    <section className={hasOverdue ? "ed-attention-block ed-attention-block--alert" : "ed-attention-block"}>
      <div className="ed-break-section ed-break-section--prominent">
        {sectionTitle}
        {totalCount > 1 ? <span className="ed-break-section-badge">{totalCount}</span> : null}
      </div>
      {rows.map((item, i) => (
        <AttentionRow
          key={item.id}
          item={item}
          navigate={navigate}
          formatAmount={formatAmount}
          t={t}
          primary={i === 0 && item.overdue}
        />
      ))}
    </section>
  );
}
