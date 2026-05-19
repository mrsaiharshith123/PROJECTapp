import { Modal } from "./Modal.jsx";
import CategoryChip from "./CategoryChip.jsx";
import PriorityBadge from "./PriorityBadge.jsx";
import { COPY } from "../constants/copy.js";
import { BILL_STATUS_UI, currentYearPrefix } from "../utils/billLifecycle.js";
import { computeBillSpendSummary } from "../utils/commitmentSpendSummary.js";
import { repeatTypeLabel } from "../constants/repeatTypes.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 p-3">
      <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 dark:text-slate-500">{label}</p>
      <p
        className={`text-lg font-bold mt-0.5 ${accent || "text-gray-900 dark:text-slate-100"}`}
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        {value}
      </p>
    </div>
  );
}

export default function BillDetailModal({
  bill,
  todayStr,
  displayStatus,
  onClose,
  onEdit,
  onAddPayment,
  onDelete,
}) {
  const summary = computeBillSpendSummary(bill, todayStr);
  const amount = Number(bill.amount) || 0;
  const statusUi = BILL_STATUS_UI[displayStatus] || BILL_STATUS_UI.pending;
  const canPay = displayStatus === "pending" || displayStatus === "overdue";
  const calendarYear = currentYearPrefix(todayStr);
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
        <div className="flex flex-wrap gap-2">
          {canPay && (
            <button
              type="button"
              onClick={() => onAddPayment(bill)}
              className="flex-1 min-w-[120px] py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
            >
              Record payment
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(bill)}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 rounded-xl"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(bill.id)}
            className="px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
          >
            Delete
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip categoryId={bill.category} />
          <PriorityBadge priorityId={bill.priority} />
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusUi.classes}`}>
            {statusUi.label}
          </span>
        </div>

        {isInsurance && (bill.insurancePolicyId || bill.insuredPersonName || bill.insuranceCompany) && (
          <div className="rounded-xl border border-teal-100 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/30 px-3 py-2 text-xs space-y-1">
            {bill.insurancePolicyId && (
              <p>
                <span className="text-gray-500">Policy ID:</span>{" "}
                <span className="font-semibold text-gray-800 dark:text-slate-100">{bill.insurancePolicyId}</span>
              </p>
            )}
            {bill.insuredPersonName && (
              <p>
                <span className="text-gray-500">Insured:</span>{" "}
                <span className="font-semibold text-gray-800 dark:text-slate-100">{bill.insuredPersonName}</span>
              </p>
            )}
            {bill.insuranceCompany && (
              <p>
                <span className="text-gray-500">Company:</span>{" "}
                <span className="font-semibold text-gray-800 dark:text-slate-100">{bill.insuranceCompany}</span>
              </p>
            )}
            {bill.repeatType && bill.repeatType !== "none" && (
              <p>
                <span className="text-gray-500">Premium:</span> ₹
                {Number(bill.amount || 0).toLocaleString()} · {repeatTypeLabel(bill.repeatType)}
              </p>
            )}
            <p className="text-[10px] text-teal-600 dark:text-teal-400">
              Use Tools → Insurance calculator for sum assured and maturity return.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
          Started {formatDate(summary.startDate)}
          {summary.endDate ? ` · Ends ${formatDate(summary.endDate)}` : " · No end date"}
          {bill.dueDate ? ` · Next due ${formatDate(bill.dueDate)}` : null}
        </p>

        {summary.ended && (
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg px-3 py-2">
            This {COPY.bill} has ended — no further payments expected.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Stat
            label="Recorded payments"
            value={`₹${summary.recordedSinceStart.toLocaleString()}`}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <Stat label="Still to go" value={futureLabel} accent="text-amber-700 dark:text-amber-400" />
          <Stat label="Per cycle" value={`₹${amount.toLocaleString()}`} />
          <Stat
            label={summary.totalProjected != null ? "Total (start → end)" : "All-time recorded"}
            value={
              summary.totalProjected != null
                ? `₹${summary.totalProjected.toLocaleString()}`
                : `₹${summary.recordedAllTime.toLocaleString()}`
            }
          />
        </div>
        {summary.priorSpend > 0 && (
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Estimated before you tracked: ~₹{summary.priorSpend.toLocaleString()} (not counted in recorded payments above).
          </p>
        )}

        {bill.category === "Subscription" && summary.endDate && !summary.ended && (
          <p className="text-[11px] text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 rounded-lg px-3 py-2">
            We&apos;ll remind you a few days before the end date so you can turn off auto-pay.
          </p>
        )}

        {bill.notes && (
          <p className="text-sm text-gray-600 dark:text-slate-300 border-t border-gray-100 dark:border-slate-700 pt-3">
            {bill.notes}
          </p>
        )}
      </div>
    </Modal>
  );
}
