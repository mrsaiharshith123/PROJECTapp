import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isActiveBill } from "../../../utils/billLifecycle.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { cn } from "../../utils/cn.js";

function daysUntil(dueDate, todayStr) {
  if (!dueDate || !todayStr) return 999;
  const a = new Date(`${todayStr}T12:00:00`);
  const b = new Date(`${dueDate}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

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

function AttentionRow({ item, navigate, formatAmount }) {
  const rowClass = item.overdue
    ? "ct-attention-row"
    : item.upcoming
      ? "ct-attention-row upcoming"
      : "ct-attention-row warning";

  return (
    <button
      key={item.id}
      type="button"
      className={`${rowClass} w-full text-left`}
      onClick={() => navigate(item.to)}
    >
      <div className="ct-row gap-3 min-w-0 flex-1 ct-attention-row-body">
        <span
          className={cn(
            "ct-icon-tile ct-home-attention-icon",
            item.overdue ? "danger" : item.upcoming ? "slate" : "amber",
          )}
        >
          <CtIcon name={item.icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="ct-attention-row-title">{item.name}</p>
          <p
            className="ct-attention-row-sub"
            style={{
              color: item.overdue
                ? "var(--ct-danger-text)"
                : item.upcoming
                  ? "var(--ct-text-muted)"
                  : "var(--ct-warning-text)",
            }}
          >
            {item.statusText}
          </p>
        </div>
      </div>
      <span
        className={cn("ct-attention-row-amount", item.upcoming && "ct-attention-row-amount-muted")}
      >
        {formatAmount(item.amount)}
      </span>
    </button>
  );
}

export default function HomeNeedsAttention() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sortedCommitments, lendings, getEffectiveStatus, todayStr } = usePerovo();
  const { formatAmount } = usePrivacyAmount();

  const { overdue, dueSoon } = useMemo(() => {
    /** @type {object[]} */
    const overdueRows = [];
    /** @type {object[]} */
    const dueSoonRows = [];

    for (const c of sortedCommitments) {
      if (overdueRows.length >= 2) break;
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
        upcoming: false,
        to: "/ledger/bills",
        icon: "warning-circle",
      });
    }

    for (const l of lendings) {
      if (overdueRows.length >= 2) break;
      if (l.type !== "lent") continue;
      for (const r of l.repaymentSchedule || []) {
        if (overdueRows.length >= 2) break;
        if (r.paymentStatus === "paid" || !r.dueDate) continue;
        const daysLate = differenceInCalendarDays(parseISO(todayStr), parseISO(r.dueDate));
        if (daysLate <= 0) continue;
        overdueRows.push({
          id: `lending-${l.id}-${r.dueDate}`,
          name: l.counterpartyName || l.personName || l.name || t("money.tab.lending"),
          amount: Number(r.amount ?? 0),
          statusText: t("home.attention.overdueDays", { days: daysLate }),
          overdue: true,
          upcoming: false,
          to: "/money/lending",
          icon: "handshake",
        });
      }
    }

    for (const c of sortedCommitments) {
      if (dueSoonRows.length >= 2) break;
      if (!isActiveBill(c, getEffectiveStatus, todayStr)) continue;
      const status = getEffectiveStatus(c);
      if (status !== "pending") continue;
      const days = daysUntil(c.dueDate, todayStr);
      if (days < 0 || days > 3) continue;
      dueSoonRows.push({
        id: `bill-${c.id}`,
        name: attentionBillTitle(c),
        amount: Number(c.amount ?? 0),
        statusText:
          days === 0
            ? t("home.dueSoon")
            : t("home.attention.dueInDays", { days }),
        overdue: false,
        upcoming: false,
        to: "/ledger/bills",
        icon: "clock",
      });
    }

    return { overdue: overdueRows, dueSoon: dueSoonRows };
  }, [sortedCommitments, lendings, getEffectiveStatus, todayStr, t]);

  const totalCount = overdue.length + dueSoon.length;
  if (totalCount === 0) return null;

  const hasOverdue = overdue.length > 0;
  const sectionTitle = t("home.requiresAction");

  return (
    <section className="ct-home-attention-section">
      <div className="ct-home-attention-label">
        <span className="ct-home-attention-dot" aria-hidden />
        <span>{sectionTitle}</span>
        {hasOverdue ? <span className="ct-count-badge danger">{overdue.length}</span> : null}
      </div>
      <div className="ct-stack-sm">
        {overdue.map((item) => (
          <AttentionRow key={item.id} item={item} navigate={navigate} formatAmount={formatAmount} />
        ))}
        {dueSoon.map((item) => (
          <AttentionRow key={item.id} item={item} navigate={navigate} formatAmount={formatAmount} />
        ))}
      </div>
    </section>
  );
}
