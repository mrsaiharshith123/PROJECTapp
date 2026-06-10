import { useMemo } from "react";
import { Card, Heading, Caption, Body, Button } from "../../index.js";
import { formatInr } from "../../../constants/symbols.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import {
  getOverdueInstallments,
  computeOverdueTotal,
  buildDefaultNoticeText,
  daysSinceOldestOverdue,
} from "../../../engines/lendingRecovery.js";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

export default function LendingOverduePanel() {
  const { t } = useTranslation();
  const { lendings, settings, addLendingPayment, todayStr } = useCommitTrack();

  const rows = useMemo(() => {
    return (lendings || [])
      .filter((l) => l.type === "lent")
      .map((l) => {
        const overdue = getOverdueInstallments(l);
        if (!overdue.length) return null;
        return {
          lending: l,
          overdue,
          total: computeOverdueTotal(overdue),
          days: daysSinceOldestOverdue(l),
        };
      })
      .filter(Boolean);
  }, [lendings]);

  if (!rows.length) return null;

  return (
    <Card className="ct-stack border border-rose-200 dark:border-rose-900/50">
      <Heading level={3}>{t("lending.overdueTitle")}</Heading>
      <Caption className="block">{t("lending.overdueHint")}</Caption>
      <div className="ct-stack-sm">
        {rows.map((row) => (
          <div key={row.lending.id} className="ct-inset ct-stack-sm !p-3">
            <div className="ct-row-between gap-2">
              <div>
                <Body className="font-semibold">{row.lending.personName}</Body>
                <Caption>
                  {t("lending.overdueCount", { count: row.overdue.length })} · {formatInr(row.total)}
                  {row.days > 0 ? ` · ${t("lending.overdueDays", { days: row.days })}` : ""}
                </Caption>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const inst = row.overdue[0];
                    const amt = Number(inst?.totalPayment) || row.total;
                    addLendingPayment(row.lending.id, { amount: amt, date: todayStr });
                  }}
                >
                  {t("lending.markPaid")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const text = buildDefaultNoticeText(row.lending, settings);
                    await shareOrCopyPlainText(text, { title: t("lending.recoveryNotice") });
                  }}
                >
                  {t("lending.shareNotice")}
                </Button>
              </div>
            </div>
            <ul className="text-xs text-[var(--ct-text-muted)] space-y-0.5">
              {row.overdue.slice(0, 4).map((inst) => (
                <li key={`${inst.dueDate}-${inst.installmentNumber ?? ""}`}>
                  {inst.dueDate} — {formatInr(Number(inst.totalPayment) || 0)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
