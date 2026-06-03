import { Modal, Button } from "../../../ui";
import { CategoryChip } from "../../patterns/CategoryChip.jsx";
import { PriorityBadge } from "../../patterns/PriorityBadge.jsx";
import { ToneSurface } from "../../patterns/ToneSurface.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import { COPY } from "../../../constants/copy.js";
import { BILL_STATUS_UI } from "../../tokens/billStatus.js";
import { computeBillSpendSummary } from "../../../utils/commitmentSpendSummary.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";
import { isCurrentCyclePaid } from "../../../utils/commitmentPayments.js";
import { repeatTypeLabel } from "../../../constants/repeatTypes.js";

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
  const summary = computeBillSpendSummary(bill, todayStr, allCommitments);
  const progress = computeBillPaymentProgress(bill, todayStr, allCommitments);
  const amount = Number(bill.amount) || 0;
  const statusUi = BILL_STATUS_UI[displayStatus] || BILL_STATUS_UI.pending;
  const canPay =
    (displayStatus === "pending" || displayStatus === "overdue") &&
    !isCurrentCyclePaid(bill, todayStr, allCommitments);
  const isInsurance = bill.category === "Insurance";

  const futureLabel =
    summary.ended
      ? "Ended"
      : summary.ongoing
        ? "Ongoing"
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
            <Button type="button" variant="primary" size="md" className="flex-1 min-w-[120px]" onClick={() => onAddPayment(bill)}>
              Record payment
            </Button>
          )}
          <Button type="button" variant="secondary" size="md" onClick={() => onEdit(bill)}>
            Edit
          </Button>
          <Button type="button" variant="danger" size="md" onClick={() => onDelete(bill.id)}>
            Delete
          </Button>
        </div>
      }
    >
      <div className="ct-stack">
        <div className="ct-row-wrap">
          <CategoryChip categoryId={bill.category} />
          <PriorityBadge priorityId={bill.priority} />
          <span className={statusUi.classes}>{statusUi.label}</span>
        </div>

        {isInsurance && (bill.insurancePolicyId || bill.insuredPersonName || bill.insuranceCompany) && (
          <ToneSurface tone="info" className="ct-stack-sm text-xs">
            {bill.insurancePolicyId && (
              <p>
                <span className="ct-caption">Policy ID:</span>{" "}
                <span className="font-semibold">{bill.insurancePolicyId}</span>
              </p>
            )}
            {bill.insuredPersonName && (
              <p>
                <span className="ct-caption">Insured:</span>{" "}
                <span className="font-semibold">{bill.insuredPersonName}</span>
              </p>
            )}
            {bill.insuranceCompany && (
              <p>
                <span className="ct-caption">Company:</span>{" "}
                <span className="font-semibold">{bill.insuranceCompany}</span>
              </p>
            )}
            {bill.repeatType && bill.repeatType !== "none" && (
              <p>
                <span className="ct-caption">Premium:</span> ₹
                {Number(bill.amount || 0).toLocaleString()} · {repeatTypeLabel(bill.repeatType)}
              </p>
            )}
            <Caption>Use Tools → Insurance calculator for sum assured and maturity return.</Caption>
          </ToneSurface>
        )}

        <Caption className="leading-relaxed">
          Started {formatDate(summary.startDate)}
          {summary.endDate ? ` · Ends ${formatDate(summary.endDate)}` : " · No end date"}
          {bill.dueDate ? ` · Next due ${formatDate(bill.dueDate)}` : null}
        </Caption>

        {summary.ended && (
          <ToneSurface tone="positive">
            <Caption>
              This {COPY.bill} has ended — shown in History. Extend the end date when editing to bring it back to your active bills.
            </Caption>
          </ToneSurface>
        )}

        <div className="ct-inset ct-stack-sm px-3 py-2.5">
          <Body className="text-xs font-semibold">Payment progress</Body>
          <Caption>{progress.label}</Caption>
          <Caption>
            From {formatDate(summary.startDate)}
            {summary.priorSpend > 0
              ? ` · ~₹${summary.priorSpend.toLocaleString("en-IN")} before you used CommitTrack`
              : ""}
            {progress.paymentEntries > 0
              ? ` · ${progress.paymentEntries} payment record${progress.paymentEntries === 1 ? "" : "s"} (₹${progress.paymentAmount.toLocaleString("en-IN")})`
              : ""}
          </Caption>
        </div>

        <div className="ct-stat-grid">
          <Stat
            label="Paid till now"
            value={`₹${(summary.paidTillNow ?? summary.spentSinceStart).toLocaleString("en-IN")}`}
            accentClass="ct-text-success"
          />
          <Stat
            label="Still to pay"
            value={
              summary.ended
                ? "Ended"
                : summary.remainingToPay != null
                  ? `₹${summary.remainingToPay.toLocaleString("en-IN")}`
                  : futureLabel
            }
            accentClass="ct-text-warning"
          />
          <Stat label="Per cycle" value={`₹${amount.toLocaleString()}`} />
          <Stat
            label={summary.totalContractValue != null ? "Total (start → end)" : "Contract total"}
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
            ₹{summary.recordedAllTime.toLocaleString("en-IN")} logged in CommitTrack · ~
            {summary.priorSpend.toLocaleString("en-IN")} from earlier installments (from your start date).
          </Caption>
        )}

        {bill.category === "Subscription" && summary.endDate && !summary.ended && (
          <ToneSurface tone="info">
            <Caption>We&apos;ll remind you a few days before the end date so you can turn off auto-pay.</Caption>
          </ToneSurface>
        )}

        {bill.notes && (
          <Caption className="border-t border-[var(--ct-border)] pt-3 block">{bill.notes}</Caption>
        )}
      </div>
    </Modal>
  );
}
