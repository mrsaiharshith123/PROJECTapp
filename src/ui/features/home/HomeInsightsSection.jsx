import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { pickMicroTip } from "../../../guidance/index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { Eyebrow } from "../../primitives/Text.jsx";

/**
 * Home insights glance — tinted tiles with semantic icon colors.
 * @param {{ seed?: number }} props
 */
export default function HomeInsightsSection({ seed = 0 }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { commitments, lendings, getEffectiveStatus, todayStr } = usePerovo();

  const tipKey = pickMicroTip(seed);

  const { overdueCount, dueSoonCount, lendingOverdueCount } = useMemo(() => {
    const overdue = commitments.filter((c) => getEffectiveStatus(c) === "overdue").length;

    const soon = commitments.filter((c) => {
      if (getEffectiveStatus(c) === "paid" || getEffectiveStatus(c) === "overdue") return false;
      if (!c.dueDate) return false;
      const days = differenceInCalendarDays(parseISO(c.dueDate), parseISO(todayStr));
      return days >= 0 && days <= 3;
    }).length;

    const lendingOverdue = lendings.filter((l) => {
      if (l.type !== "lent") return false;
      return (l.repaymentSchedule || []).some((r) => {
        if (r.paymentStatus === "paid") return false;
        if (!r.dueDate) return false;
        return differenceInCalendarDays(parseISO(todayStr), parseISO(r.dueDate)) > 0;
      });
    }).length;

    return { overdueCount: overdue, dueSoonCount: soon, lendingOverdueCount: lendingOverdue };
  }, [commitments, lendings, getEffectiveStatus, todayStr]);

  const alerts = [
    overdueCount > 0
      ? {
          key: "overdue",
          tone: "danger",
          icon: "warning",
          label: t("home.insight.overdue", { count: overdueCount }),
          to: "/money/bills",
        }
      : null,
    dueSoonCount > 0
      ? {
          key: "soon",
          tone: "amber",
          icon: "hourglass",
          label: t("home.insight.dueSoon", { count: dueSoonCount }),
          to: "/money/bills",
        }
      : null,
    lendingOverdueCount > 0
      ? {
          key: "lending",
          tone: "amber",
          icon: "handshake",
          label: t("home.attention.lendingOverdue", { count: lendingOverdueCount }),
          to: "/money/lending",
        }
      : null,
  ].filter(Boolean);

  return (
    <section className="ct-stack-sm">
      <div className="ct-stat-tile indigo !p-3">
        <div className="ct-row gap-3 items-start">
          <span className="ct-icon-tile violet shrink-0" aria-hidden>
            <CtIcon name="lightning" size={18} />
          </span>
          <div className="min-w-0">
            <Eyebrow className="!mb-1">{t("home.insight")}</Eyebrow>
            <p className="text-sm leading-snug opacity-90">{t(tipKey)}</p>
          </div>
        </div>
      </div>
      {alerts.length > 0 ? (
        <div className="ct-grid-2 gap-2">
          {alerts.map((a) => (
            <button
              key={a.key}
              type="button"
              className={`ct-stat-tile ${a.tone} !p-3 text-left w-full`}
              onClick={() => navigate(a.to)}
            >
              <div className="ct-row gap-2 items-center">
                <span className={`ct-icon-tile-sm ${a.tone}`} aria-hidden>
                  <CtIcon name={a.icon} size={16} />
                </span>
                <span className="text-xs font-semibold leading-snug">{a.label}</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
