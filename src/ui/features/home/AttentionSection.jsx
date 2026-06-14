import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card, Heading, ListRow } from "../../index.js";

export default function AttentionSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { commitments, lendings, getEffectiveStatus, todayStr } = useCommitTrack();

  const { overdueCommitments, dueSoon, overdueLen } = useMemo(() => {
    const overdue = commitments.filter((c) => getEffectiveStatus(c) === "overdue").slice(0, 3);

    const soon = commitments
      .filter((c) => {
        if (getEffectiveStatus(c) === "paid") return false;
        if (!c.dueDate) return false;
        const days = differenceInCalendarDays(parseISO(c.dueDate), parseISO(todayStr));
        return days >= 0 && days <= 3;
      })
      .slice(0, 2);

    const lendingOverdue = lendings.filter((l) => {
      if (l.type !== "lent") return false;
      return (l.repaymentSchedule || []).some((r) => {
        if (r.paymentStatus === "paid") return false;
        if (!r.dueDate) return false;
        return differenceInCalendarDays(parseISO(todayStr), parseISO(r.dueDate)) > 0;
      });
    }).length;

    return { overdueCommitments: overdue, dueSoon: soon, overdueLen: lendingOverdue };
  }, [commitments, lendings, getEffectiveStatus, todayStr]);

  if (overdueCommitments.length === 0 && dueSoon.length === 0 && overdueLen === 0) return null;

  return (
    <Card variant="flat" className="ct-stack">
      <Heading level={3}>{t("home.attention.title")}</Heading>
      {overdueCommitments.map((c) => (
        <ListRow
          key={c.id}
          title={c.name}
          amount={formatInr(Number(c.amount ?? 0))}
          status={t("bills.overdue")}
          statusTone="danger"
          onClick={() => navigate("/commitments")}
        />
      ))}
      {dueSoon.map((c) => {
        const days = differenceInCalendarDays(parseISO(c.dueDate), parseISO(todayStr));
        return (
          <ListRow
            key={`soon-${c.id}`}
            title={c.name}
            amount={formatInr(Number(c.amount ?? 0))}
            status={t("home.attention.dueInDays", { days })}
            statusTone="warning"
            onClick={() => navigate("/commitments")}
          />
        );
      })}
      {overdueLen > 0 && (
        <button type="button" className="ct-link text-sm text-left" onClick={() => navigate("/lending")}>
          {t("home.attention.lendingOverdue", { count: overdueLen })}
        </button>
      )}
    </Card>
  );
}
