import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { pickMicroTip } from "../../../guidance/index.js";
import { Eyebrow } from "../../primitives/Text.jsx";

/**
 * Home insights glance — titled card with tip and compact alert chips.
 * @param {{ seed?: number }} props
 */
export default function HomeInsightsSection({ seed = 0 }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { commitments, lendings, getEffectiveStatus, todayStr } = useCommitTrack();

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

  const hasAlerts = overdueCount > 0 || dueSoonCount > 0 || lendingOverdueCount > 0;

  return (
    <section className="ct-home-insight-card">
      <Eyebrow className="ct-home-insight-heading">{t("home.insight")}</Eyebrow>
      <p className="ct-home-insight-tip">{t(tipKey)}</p>
      {hasAlerts ? (
        <div className="ct-home-insight-alerts">
          {overdueCount > 0 ? (
            <button
              type="button"
              className="ct-home-insight-chip ct-home-insight-chip-danger"
              onClick={() => navigate("/commitments")}
            >
              {t("home.insight.overdue", { count: overdueCount })}
            </button>
          ) : null}
          {dueSoonCount > 0 ? (
            <button
              type="button"
              className="ct-home-insight-chip ct-home-insight-chip-warn"
              onClick={() => navigate("/commitments")}
            >
              {t("home.insight.dueSoon", { count: dueSoonCount })}
            </button>
          ) : null}
          {lendingOverdueCount > 0 ? (
            <button
              type="button"
              className="ct-home-insight-chip ct-home-insight-chip-warn"
              onClick={() => navigate("/lending")}
            >
              {t("home.attention.lendingOverdue", { count: lendingOverdueCount })}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
