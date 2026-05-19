import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../Card.jsx";
import CommitmentEditModal from "../CommitmentEditModal.jsx";
import { COPY } from "../../constants/copy.js";
import { isHistoryBill } from "../../utils/billLifecycle.js";
import { recentCommitmentPaymentEvents } from "../../utils/profileStats.js";
import { getBillDisplayName } from "../../utils/billDisplayName.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
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
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);
  const [showPayments, setShowPayments] = useState(true);
  const [showEndedBills, setShowEndedBills] = useState(true);

  const payments = useMemo(
    () => recentCommitmentPaymentEvents(commitments, 50),
    [commitments]
  );

  const endedBills = useMemo(() => {
    return commitments
      .filter((c) => isHistoryBill(c, getEffectiveStatus, todayStr))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [commitments, getEffectiveStatus, todayStr]);

  const handleRemovePayment = (row) => {
    const label = `${row.name} · ₹${Number(row.amount).toLocaleString("en-IN")} on ${formatDate(row.date)}`;
    if (
      !window.confirm(
        `Remove this payment record?\n\n${label}\n\nThe bill will show as due again if this was the only payment for that month.`
      )
    ) {
      return;
    }
    removeCommitmentPayment(row.commitmentId, row.paymentIndex);
  };

  const handleDeleteBill = (bill) => {
    if (
      !window.confirm(
        `Delete "${getBillDisplayName(bill)}" permanently?\n\nThis removes the bill and all payment records on it.`
      )
    ) {
      return;
    }
    deleteCommitment(bill.id);
  };

  return (
    <>
      <Card className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">History & corrections</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Remove mistaken payments or delete test {COPY.bills.toLowerCase()}. Active bills are on the Bills page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/commitments")}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0"
          >
            Open bills
          </button>
        </div>

        {payments.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowPayments((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-slate-400"
            >
              <span>Recorded payments ({payments.length})</span>
              <span aria-hidden>{showPayments ? "▲" : "▼"}</span>
            </button>
            {showPayments && payments.length === 0 && (
              <p className="text-xs text-gray-500 px-1">No payment records yet.</p>
            )}
            {showPayments && payments.length > 0 && (
              <ul className="divide-y divide-gray-100 dark:divide-slate-700 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                {payments.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-2 py-2.5 px-3 bg-white dark:bg-slate-900/50 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 dark:text-slate-200 truncate">{row.name}</p>
                      <p className="text-[11px] text-gray-500">{formatDate(row.date)}</p>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-slate-100 shrink-0">
                      ₹{Number(row.amount).toLocaleString("en-IN")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePayment(row)}
                      className="shrink-0 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {endedBills.length > 0 && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowEndedBills((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-slate-400"
            >
              <span>Ended / paid {COPY.bills.toLowerCase()} ({endedBills.length})</span>
              <span aria-hidden>{showEndedBills ? "▲" : "▼"}</span>
            </button>
            {showEndedBills && endedBills.length === 0 && (
              <p className="text-xs text-gray-500 px-1">No ended bills in history.</p>
            )}
            {showEndedBills && endedBills.length > 0 && (
              <ul className="space-y-2">
                {endedBills.map((bill) => (
                  <li
                    key={bill.id}
                    className="rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-800/50 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                      {getBillDisplayName(bill)}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {(bill.payments || []).length} payment record
                      {(bill.payments || []).length === 1 ? "" : "s"}
                      {bill.endDate ? ` · ended ${formatDate(bill.endDate)}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setEditing(bill)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBill(bill)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
