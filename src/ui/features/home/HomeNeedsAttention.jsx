import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  const { sortedCommitments, getEffectiveStatus, todayStr } = usePerovo();

  const rows = useMemo(() => {
    const out = [];
    for (const c of sortedCommitments) {
      if (!isActiveBill(c, getEffectiveStatus, todayStr)) continue;
      const status = getEffectiveStatus(c);
      const days = daysUntil(c.dueDate, todayStr);
      const urgent = status === "overdue" || (status === "pending" && days >= 0 && days <= 3);
      if (!urgent) continue;
      out.push({
        id: c.id,
        name: c.name,
        amount: c.amount,
        dueDate: c.dueDate,
        status,
        days,
      });
      if (out.length >= 5) break;
    }
    return out;
  }, [sortedCommitments, getEffectiveStatus, todayStr]);

  if (rows.length === 0) return null;

  const badgeCount = rows.length;

  return (
    <ScreenSection
      title={t("home.needsAttention")}
      action={<span className="ct-count-badge">{badgeCount}</span>}
    >
      <div className="ct-stack-sm">
        {rows.map((item) => {
          const overdue = item.status === "overdue";
          const rowClass = overdue ? "ct-attention-row" : "ct-attention-row warning";
          const iconName = overdue ? "warning-circle" : "clock";
          const statusText = overdue
            ? t("bills.overdue")
            : t("home.dueDate", {
                date: new Date(`${item.dueDate}T12:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                }),
              });
          return (
            <button
              key={item.id}
              type="button"
              className={`${rowClass} w-full text-left`}
              onClick={() => navigate("/money/bills")}
            >
              <div className="ct-row gap-3 min-w-0">
                <span className={cn("ct-icon-tile ct-icon-tile-sm", overdue ? "danger" : "amber")}>
                  <CtIcon name={iconName} size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ct-text)] truncate">{item.name}</p>
                  <p
                    className="text-xs"
                    style={{ color: overdue ? "#f87171" : "#fbbf24" }}
                  >
                    {statusText}
                  </p>
                </div>
              </div>
              <span className="ct-stat-value text-[15px] shrink-0">
                {formatInr(Number(item.amount ?? 0))}
              </span>
            </button>
          );
        })}
      </div>
    </ScreenSection>
  );
}
