import { useMemo } from "react";
import { Card, Heading, Caption, Body, Button } from "../../index.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import {
  getOverdueInstallments,
  computeOverdueTotal,
  buildDefaultNoticeText,
  daysSinceOldestOverdue,
} from "../../../engines/lendingRecovery.js";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

export default function LendingOverduePanel() {
  const { t } = useTranslation();
  const { formatAmount } = usePrivacyAmount();
  const { lendings, settings, addLendingPayment, todayStr } = usePerovo();

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
    <div className="ed-inset-amber ed-stack-sm">
      <div className="flex items-center gap-2 relative">
        <span style={{ color: "var(--ed-red)", flexShrink: 0 }} aria-hidden>
          <CtIcon name="warning" size={20} context="status" />
        </span>
        <div>
          <Heading level={3}>{t("lending.overdueTitle")}</Heading>
          <Caption className="block">{t("lending.overdueHint")}</Caption>
        </div>
      </div>
      <div className="ed-stack-sm relative">
        {rows.map((row) => (
          <Card key={row.lending.id} className="ed-stack-sm !p-3">
            <div className="ed-row-between gap-2 flex-wrap">
              <div className="min-w-0">
                <Body className="font-semibold">{row.lending.personName}</Body>
                <Caption className="block">
                  {t("lending.overdueCount", { count: row.overdue.length })} · {formatAmount(row.total)}
                  {row.days > 0 ? ` · ${t("lending.overdueDays", { days: row.days })}` : ""}
                </Caption>
              </div>
              <div className="ed-inset shrink-0 text-right min-w-[5.5rem]">
                <p className="ed-numeral ed-numeral">{formatAmount(row.total)}</p>
                <p className="ed-field-label">{t("lending.overdueTitle")}</p>
              </div>
            </div>
            <ul className="ed-caption space-y-0.5">
              {row.overdue.slice(0, 4).map((inst) => (
                <li key={`${inst.dueDate}-${inst.installmentNumber ?? ""}`} className="ed-row-between gap-2">
                  <span>{inst.dueDate}</span>
                  <span className="ed-numeral font-semibold">{formatAmount(Number(inst.totalPayment) || 0)}</span>
                </li>
              ))}
            </ul>
            <div className="ed-row-wrap gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="primary"
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
          </Card>
        ))}
      </div>
    </div>
  );
}
