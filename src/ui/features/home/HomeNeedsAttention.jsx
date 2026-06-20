import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isActiveBill } from "../../../utils/billLifecycle.js";
import { formatInr } from "../../../constants/symbols.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { ScreenSection } from "../../layout/Screen.jsx";
import { cn } from "../../utils/cn.js";

function daysUntil(dueDate, todayStr) {
  if (!dueDate || !todayStr) return 999;
  const a = new Date(`${todayStr}T12:00:00`);
  const b = new Date(`${dueDate}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export default function HomeNeedsAttention() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sortedCommitments, lendings, getEffectiveStatus, todayStr } = usePerovo();

  const rows = useMemo(() => {
    /** @type {{ id: string, name: string, amount: number, statusText: string, overdue: boolean, to: string, icon: string }[]} */
    const out = [];

    for (const c of sortedCommitments) {
      if (out.length >= 3) break;
      if (!isActiveBill(c, getEffectiveStatus, todayStr)) continue;
      const status = getEffectiveStatus(c);
      if (status !== "overdue") continue;
      const daysLate = Math.max(1, -daysUntil(c.dueDate, todayStr));
      out.push({
        id: `bill-${c.id}`,
        name: c.name,
        amount: Number(c.amount ?? 0),
        statusText: t("home.attention.overdueDays", { days: daysLate }),
        overdue: true,
        to: "/money/bills",
        icon: "warning-circle",
      });
    }

    for (const c of sortedCommitments) {
      if (out.length >= 3) break;
      if (!isActiveBill(c, getEffectiveStatus, todayStr)) continue;
      const status = getEffectiveStatus(c);
      if (status !== "pending") continue;
      const days = daysUntil(c.dueDate, todayStr);
      if (days < 0 || days > 3) continue;
      out.push({
        id: `bill-${c.id}`,
        name: c.name,
        amount: Number(c.amount ?? 0),
        statusText:
          days === 0
            ? t("home.dueSoon")
            : t("home.attention.dueInDays", { days }),
        overdue: false,
        to: "/money/bills",
        icon: "clock",
      });
    }

    for (const l of lendings) {
      if (out.length >= 3) break;
      if (l.type !== "lent") continue;
      for (const r of l.repaymentSchedule || []) {
        if (out.length >= 3) break;
        if (r.paymentStatus === "paid" || !r.dueDate) continue;
        const daysLate = differenceInCalendarDays(parseISO(todayStr), parseISO(r.dueDate));
        if (daysLate <= 0) continue;
        out.push({
          id: `lending-${l.id}-${r.dueDate}`,
          name: l.counterpartyName || l.name || t("money.tab.lending"),
          amount: Number(r.amount ?? 0),
          statusText: t("home.attention.overdueDays", { days: daysLate }),
          overdue: true,
          to: "/money/lending",
          icon: "handshake",
        });
      }
    }

    return out;
  }, [sortedCommitments, lendings, getEffectiveStatus, todayStr, t]);

  if (rows.length === 0) return null;

  return (
    <ScreenSection
      title={t("home.needsAttention")}
      action={<span className="ct-count-badge">{rows.length}</span>}
    >
      <div className="ct-stack-sm">
        {rows.map((item) => {
          const rowClass = item.overdue ? "ct-attention-row" : "ct-attention-row warning";
          return (
            <button
              key={item.id}
              type="button"
              className={`${rowClass} w-full text-left`}
              onClick={() => navigate(item.to)}
            >
              <div className="ct-row gap-3 min-w-0">
                <span
                  className={cn(
                    "ct-icon-tile ct-home-attention-icon",
                    item.overdue ? "danger" : "amber",
                  )}
                >
                  <CtIcon name={item.icon} size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ct-text)] truncate">{item.name}</p>
                  <p
                    className="text-xs"
                    style={{ color: item.overdue ? "var(--ct-danger-text)" : "var(--ct-warning-text)" }}
                  >
                    {item.statusText}
                  </p>
                </div>
              </div>
              <span className="ct-stat-value text-[15px] shrink-0">{formatInr(item.amount)}</span>
            </button>
          );
        })}
      </div>
    </ScreenSection>
  );
}
