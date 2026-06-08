import { Modal, Button } from "../../../ui";
import { CategoryChip } from "../../patterns/CategoryChip.jsx";
import { PriorityBadge } from "../../patterns/PriorityBadge.jsx";
import { ToneSurface } from "../../patterns/ToneSurface.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import { computeBillSpendSummary } from "../../../utils/commitmentSpendSummary.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";
import { isCurrentCyclePaid } from "../../../utils/commitmentPayments.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateBillStatus, translateRepeatType } from "../../../i18n/domainLabels.js";
import { translateBillProgressLabel } from "../../../i18n/billLabels.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Stat({ label, value, accentClass = "" }) {
  return (
    <div className="ct-stat-cell">
      <p className="ct-stat-cell-label">{label}</p>
      <p className={`ct-stat-cell-value ${accentClass}`}>{value}</p>
    </div>
  );
}

export default function BillDetailModal({
  bill,
  todayStr,
  allCommitments = [],
  displayStatus,
  onClose,
  onEdit,
  onAddPayment,
  onDelete,
}) {
  const { t } = useTranslation();
  const summary = computeBillSpendSummary(bill, todayStr, allCommitments);
  const progress = computeBillPaymentProgress(bill, todayStr, allCommitments);
  const amount = Number(bill.amount) || 0;
  const statusLabel = translateBillStatus(t, displayStatus);
  const canPay =
    (displayStatus === "pending" || displayStatus === "overdue") &&
    !isCurrentCyclePaid(bill, todayStr, allCommitments);
  const isInsurance = bill.category === "Insurance";

  const futureLabel = summary.ended
    ? t("bill.ended")
    : summary.ongoing
      ? t("bill.ongoing")
      : summary.futureSpend != null
        ? `₹${summary.futureSpend.toLocaleString()}`
        : "—";

  return (
    <Modal
      title={bill.name}
      onClose={onClose}
      footer={
        <div className="ct-row-wrap">
          {canPay && (
            <Button type="button" variant="primary" size="md" className="flex-1 min-w-0" onClick={() => onAddPayment(bill)}>
              {t("bill.detail.recordPayment")}
            </Button>
          )}
          <Button type="button" variant="secondary" size="md" onClick={() => onEdit(bill)}>
            {t("common.edit")}
          </Button>
          <Button type="button" variant="danger" size="md" onClick={() => onDelete(bill.id)}>
            {t("common.delete")}
          </Button>
        </div>
      }
    >
      <div className="ct-stack">
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

        <div className="ct-stat-grid">
          <Stat
            label={t("bill.detail.paidTillNow")}
            value={`₹${(summary.paidTillNow ?? summary.spentSinceStart).toLocaleString("en-IN")}`}
            accentClass="ct-text-success"
          />
          <Stat
            label={t("bill.detail.stillToPay")}
            value={
              summary.ended
                ? t("bill.ended")
                : summary.remainingToPay != null
                  ? `₹${summary.remainingToPay.toLocaleString("en-IN")}`
                  : futureLabel
            }
            accentClass="ct-text-warning"
          />
          <Stat label={t("bill.detail.perCycle")} value={`₹${amount.toLocaleString()}`} />
          <Stat
            label={summary.totalContractValue != null ? t("bill.detail.totalRange") : t("bill.detail.contractTotal")}
            value={
              summary.totalContractValue != null
                ? `₹${summary.totalContractValue.toLocaleString("en-IN")}`
                : summary.totalProjected != null
                  ? `₹${summary.totalProjected.toLocaleString("en-IN")}`
                  : "—"
            }
          />
        </div>
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
