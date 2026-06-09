import { useMemo, useState } from "react";
import { Card } from "../../../ui";
import CommitmentEditModal from "../modals/CommitmentEditModal.jsx";
import { useCopy } from "../../../i18n/useCopy.js";
import { isHistoryBill } from "../../../utils/billLifecycle.js";
import { recentCommitmentPaymentEvents } from "../../../utils/profileStats.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProfileHistorySection({
  commitments,
  getEffectiveStatus,
  todayStr,
  deleteCommitment,
  removeCommitmentPayment,
  updateCommitment,
}) {
  const copy = useCopy();
  const [editing, setEditing] = useState(null);
  const [showPayments, setShowPayments] = useState(true);
  const [showBills, setShowBills] = useState(true);

  const payments = useMemo(() => recentCommitmentPaymentEvents(commitments, 50), [commitments]);
  const endedBills = useMemo(
    () =>
      commitments
        .filter((c) => isHistoryBill(c, getEffectiveStatus, todayStr))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    [commitments, getEffectiveStatus, todayStr]
  );

  return (
    <>
      <Card className="space-y-3">
        <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">History & corrections</p>

        <button
          type="button"
          onClick={() => setShowPayments((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-slate-400"
        >
          <span>Recorded payments ({payments.length})</span>
          <span aria-hidden>{showPayments ? "▲" : "▼"}</span>
        </button>
        {showPayments && (
          <ul className="space-y-2">
            {payments.length === 0 && <li className="text-xs text-gray-500">No payment records yet.</li>}
            {payments.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-gray-100 dark:border-slate-700 px-3 py-2 flex items-center gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{row.name}</p>
                  <p className="text-[11px] text-gray-500">{formatDate(row.date)}</p>
                </div>
                <span className="text-sm font-semibold">₹{Number(row.amount).toLocaleString("en-IN")}</span>
                <button
                  type="button"
                  onClick={() => removeCommitmentPayment(row.commitmentId, row.paymentIndex)}
                  className="px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => setShowBills((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-slate-400"
        >
          <span>Ended / paid {copy.bills.toLowerCase()} ({endedBills.length})</span>
          <span aria-hidden>{showBills ? "▲" : "▼"}</span>
        </button>
        {showBills && (
          <ul className="space-y-2">
            {endedBills.length === 0 && <li className="text-xs text-gray-500">No ended bills in history.</li>}
            {endedBills.map((bill) => (
              <li key={bill.id} className="rounded-xl border border-gray-100 dark:border-slate-700 px-3 py-2.5">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{getBillDisplayName(bill)}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {(bill.payments || []).length} payment record{(bill.payments || []).length === 1 ? "" : "s"}
                  {bill.endDate ? ` · ended ${formatDate(bill.endDate)}` : ""}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(bill)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCommitment(bill.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <CommitmentEditModal
          key={editing.id}
          commitment={editing}
          onClose={() => setEditing(null)}
          onSave={(id, patch) => {
            updateCommitment(id, patch);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
