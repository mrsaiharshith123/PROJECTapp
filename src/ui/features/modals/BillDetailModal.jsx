import { Modal, Button } from "../../../ui";
import { CategoryChip } from "../../patterns/CategoryChip.jsx";
import { PriorityBadge } from "../../patterns/PriorityBadge.jsx";
import { ToneSurface } from "../../patterns/ToneSurface.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import { BillDetailCharts } from "../commitments/BillDetailCharts.jsx";
import InsuranceWorthPanel from "../commitments/InsuranceWorthPanel.jsx";
import { computeBillSpendSummary } from "../../../utils/commitmentSpendSummary.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";
import {
  isCurrentCyclePaid,
  lastUndoablePaymentIndex,
} from "../../../utils/commitmentPayments.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateBillStatus, translateRepeatType } from "../../../i18n/domainLabels.js";
import { translateBillProgressLabel } from "../../../i18n/billLabels.js";

import { formatInr } from "../../../constants/symbols.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BillDetailModal({
  bill,
  todayStr,
  allCommitments = [],
  displayStatus,
  onClose,
  onEdit,
  onAddPayment,
  onUndoPayment,
  onDelete,
  sheet = false,
}) {
  const { t } = useTranslation();
  const summary = computeBillSpendSummary(bill, todayStr, allCommitments);
  const progress = computeBillPaymentProgress(bill, todayStr, allCommitments);
  const amount = Number(bill.amount) || 0;
  const statusLabel = translateBillStatus(t, displayStatus);
  const cyclePaid = isCurrentCyclePaid(bill, todayStr, allCommitments);
  const undoIndex = lastUndoablePaymentIndex(bill, todayStr, allCommitments);
  const canPay =
    (displayStatus === "pending" || displayStatus === "overdue") && !cyclePaid;
  const canUndo = cyclePaid && undoIndex >= 0 && typeof onUndoPayment === "function";
  const isInsurance = bill.category === "Insurance";

  return (
    <Modal
      title={bill.name}
      onClose={onClose}
      sheet={sheet}
      footer={
        <div className="ct-stack-sm w-full">
          {canPay ? (
            <Button type="button" variant="primary" size="md" className="w-full" onClick={() => onAddPayment(bill)}>
              {t("bills.markPaid")}
            </Button>
          ) : null}
          {canUndo ? (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full"
              onClick={() => onUndoPayment(bill, undoIndex)}
            >
              {t("bill.detail.undoPayment")}
            </Button>
          ) : null}
          <div className="ct-row-wrap">
            <Button type="button" variant="secondary" size="md" onClick={() => onEdit(bill)}>
              {t("common.edit")}
            </Button>
            <Button type="button" variant="danger" size="md" onClick={() => onDelete(bill.id)}>
              {t("common.delete")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="ct-stack">
        <div className="ct-hero-card survival ct-bill-detail-hero">
          <div className="ct-hero-glow amber" aria-hidden />
          <p className="ct-hero-label">{statusLabel}</p>
          <p className="ct-hero-number">{formatInr(amount)}</p>
          {bill.dueDate ? (
            <Caption className="block relative mt-1">
              {t("bill.detail.nextDue", { date: formatDate(bill.dueDate) })}
            </Caption>
          ) : null}
          <div className="ct-bill-detail-actions relative">
            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(bill)}>
              {t("common.edit")}
            </Button>
            {canPay ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onAddPayment(bill)}>
                {t("bill.detail.remind")}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="ct-row-wrap">
          <CategoryChip categoryId={bill.category} />
          <PriorityBadge priorityId={bill.priority} />
          <span className="ct-status ct-status-neutral">{statusLabel}</span>
        </div>

        {isInsurance && (bill.insurancePolicyId || bill.insuredPersonName || bill.insuranceCompany) && (
          <ToneSurface tone="info" className="ct-stack-sm text-xs">
            {bill.insurancePolicyId && (
              <p>
                <span className="ct-caption">{t("bill.detail.policyId")}</span>{" "}
                <span className="font-semibold">{bill.insurancePolicyId}</span>
              </p>
            )}
            {bill.insuredPersonName && (
              <p>
                <span className="ct-caption">{t("bill.detail.insured")}</span>{" "}
                <span className="font-semibold">{bill.insuredPersonName}</span>
              </p>
            )}
            {bill.insuranceCompany && (
              <p>
                <span className="ct-caption">{t("bill.detail.company")}</span>{" "}
                <span className="font-semibold">{bill.insuranceCompany}</span>
              </p>
            )}
            {bill.repeatType && bill.repeatType !== "none" && (
              <p>
                <span className="ct-caption">{t("bill.detail.premium")}</span> ₹
                {Number(bill.amount || 0).toLocaleString()} · {translateRepeatType(t, bill.repeatType)}
              </p>
            )}
            <Caption>{t("bill.detail.insuranceHint")}</Caption>
          </ToneSurface>
        )}

        <Caption className="leading-relaxed">
          {t("bill.detail.started", { date: formatDate(summary.startDate) })}
          {summary.endDate
            ? ` · ${t("bill.detail.ends", { date: formatDate(summary.endDate) })}`
            : ` · ${t("bill.detail.noEndDate")}`}
          {bill.dueDate ? ` · ${t("bill.detail.nextDue", { date: formatDate(bill.dueDate) })}` : null}
        </Caption>

        {summary.ended && (
          <ToneSurface tone="positive">
            <Caption>{t("bill.detail.endedNote")}</Caption>
          </ToneSurface>
        )}

        <div className="ct-inset ct-stack-sm px-3 py-2.5">
          <Body className="text-xs font-semibold">{t("bill.detail.paymentProgress")}</Body>
          <Caption>{translateBillProgressLabel(t, progress)}</Caption>
          <Caption>
            {t("bill.detail.started", { date: formatDate(summary.startDate) })}
            {summary.priorSpend > 0
              ? t("bill.detail.priorSpend", {
                  amount: `₹${summary.priorSpend.toLocaleString("en-IN")}`,
                })
              : ""}
            {progress.paymentEntries > 0
              ? t("bill.detail.paymentRecords", {
                  count: progress.paymentEntries,
                  amount: `₹${progress.paymentAmount.toLocaleString("en-IN")}`,
                })
              : ""}
          </Caption>
        </div>

        <BillDetailCharts
          bill={bill}
          summary={summary}
          allCommitments={allCommitments}
          perCycleAmount={amount}
        />

        {isInsurance ? <InsuranceWorthPanel bill={bill} /> : null}

        {progress.paymentEntries > 0 && summary.priorSpend > 0 && (
          <Caption>
            {t("bill.detail.loggedSplit", {
              logged: summary.recordedAllTime.toLocaleString("en-IN"),
              prior: summary.priorSpend.toLocaleString("en-IN"),
            })}
          </Caption>
        )}

        {bill.category === "Subscription" && summary.endDate && !summary.ended && (
          <ToneSurface tone="info">
            <Caption>{t("bill.detail.subscriptionReminder")}</Caption>
          </ToneSurface>
        )}

        {bill.notes && (
          <Caption className="border-t border-[var(--ct-border)] pt-3 block">{bill.notes}</Caption>
        )}
      </div>
    </Modal>
  );
}
