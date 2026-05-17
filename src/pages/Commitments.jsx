import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInCalendarDays, parseISO } from "date-fns";
import Card from "../components/Card";
import CategoryChip from "../components/CategoryChip.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import CommitmentEditModal from "../components/CommitmentEditModal.jsx";
import BillDetailModal from "../components/BillDetailModal.jsx";
import { Modal } from "../components/Modal.jsx";
import { COPY } from "../constants/copy.js";
import { BILL_STATUS_UI, isActiveBill, isHistoryBill } from "../utils/billLifecycle.js";
import { repeatTypeLabel } from "../constants/repeatTypes.js";
import { getBillDisplayName } from "../utils/billDisplayName.js";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { todayYmd } from "../utils/dates.js";
import { monthlyBurdenForCommitment } from "../engines/burden.js";
import { priorityRank } from "../constants/priority.js";

function formatDate(dateStr) {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const Commitments = () => {
  const navigate = useNavigate();
  const {
    sortedCommitments,
    getEffectiveStatus,
    addCommitmentPayment,
    deleteCommitment,
    updateCommitment,
    todayStr,
  } = useCommitTrack();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterPreset, setFilterPreset] = useState("");
  const [sortBy, setSortBy] = useState("priority_due");
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailFor, setDetailFor] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => todayYmd());

  const withEffective = useMemo(
    () =>
      sortedCommitments.map((c) => ({
        ...c,
        effectiveStatus: getEffectiveStatus(c),
      })),
    [sortedCommitments, getEffectiveStatus]
  );

  const filtered = useMemo(() => {
    let list = withEffective.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory && item.category !== filterCategory) return false;
      if (filterStatus && item.effectiveStatus !== filterStatus) return false;
      if (filterPriority && item.priority !== filterPriority) return false;
      return true;
    });

    if (filterPreset === "recurring") {
      list = list.filter((i) => i.repeatType && i.repeatType !== "none");
    } else if (filterPreset === "subscriptions") {
      list = list.filter((i) => i.category === "Subscription");
    } else if (filterPreset === "loans_emi") {
      list = list.filter((i) => i.category === "EMI" || i.category === "Loan");
    } else if (filterPreset === "overdue_only") {
      list = list.filter((i) => i.effectiveStatus === "overdue");
    } else if (filterPreset === "upcoming") {
      list = list.filter((i) => {
        if (i.effectiveStatus !== "pending" || !i.dueDate) return false;
        try {
          const d = differenceInCalendarDays(
            parseISO(`${i.dueDate}T12:00:00`),
            parseISO(`${todayStr}T12:00:00`)
          );
          return d >= 0 && d <= 14;
        } catch {
          return false;
        }
      });
    } else if (filterPreset === "high_remaining") {
      list = list.filter((i) => Number(i.remainingAmount ?? 0) >= 15000);
    } else if (filterPreset === "high_pressure" && list.length) {
      const burdens = list
        .map((i) => monthlyBurdenForCommitment(i, getEffectiveStatus))
        .sort((a, b) => a - b);
      const med = burdens[Math.floor(burdens.length / 2)] ?? 0;
      list = list.filter((i) => monthlyBurdenForCommitment(i, getEffectiveStatus) >= med);
    }

    const burden = (i) => monthlyBurdenForCommitment(i, getEffectiveStatus);
    const rem = (i) => Number(i.remainingAmount ?? 0);
    const sorted = [...list];
    if (sortBy === "due_soonest") {
      sorted.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    } else if (sortBy === "burden_desc") {
      sorted.sort((a, b) => burden(b) - burden(a));
    } else if (sortBy === "remaining_desc") {
      sorted.sort((a, b) => rem(b) - rem(a));
    } else if (sortBy === "priority") {
      sorted.sort((a, b) => {
        const d = priorityRank(a.priority) - priorityRank(b.priority);
        if (d !== 0) return d;
        return (a.dueDate || "").localeCompare(b.dueDate || "");
      });
    } else {
      sorted.sort((a, b) => {
        const d = priorityRank(a.priority) - priorityRank(b.priority);
        if (d !== 0) return d;
        return (a.dueDate || "").localeCompare(b.dueDate || "");
      });
    }

    return sorted;
  }, [
    withEffective,
    search,
    filterCategory,
    filterStatus,
    filterPriority,
    filterPreset,
    sortBy,
    getEffectiveStatus,
    todayStr,
  ]);

  const activeBills = useMemo(() => filtered.filter((c) => isActiveBill(c)), [filtered]);
  const historyBills = useMemo(() => {
    let list = withEffective.filter((c) => isHistoryBill(c));
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    if (filterCategory) list = list.filter((i) => i.category === filterCategory);
    return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [withEffective, search, filterCategory]);

  const counts = useMemo(() => {
    return withEffective.filter(isActiveBill).reduce(
      (acc, c) => {
        acc[c.effectiveStatus] = (acc[c.effectiveStatus] || 0) + 1;
        return acc;
      },
      { paid: 0, pending: 0, overdue: 0, upnext: 0 }
    );
  }, [withEffective]);

  const openPayment = (item) => {
    setPaymentFor(item);
    setPayAmount("");
    setPayDate(todayYmd());
  };

  const submitPayment = () => {
    if (!paymentFor) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return;
    addCommitmentPayment(paymentFor.id, { amount: amt, date: payDate });
    setPaymentFor(null);
    setPayAmount("");
  };

  const payRemaining = () => {
    if (!paymentFor) return;
    const rem = Number(paymentFor.remainingAmount ?? 0);
    if (rem <= 0) return;
    addCommitmentPayment(paymentFor.id, { amount: rem, date: payDate });
    setPaymentFor(null);
    setPayAmount("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400 dark:text-slate-500 font-medium uppercase tracking-widest">Monthly</p>
          <h1
            className="text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {COPY.billsPageTitle}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate("/add")}
          className="shrink-0 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-sm"
        >
          + {COPY.addBill}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-amber-600" style={{ fontFamily: "'Sora', sans-serif" }}>
            {counts.pending || 0}
          </p>
          <p className="text-[10px] text-amber-600 font-medium mt-0.5">Due</p>
        </div>
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-sky-600" style={{ fontFamily: "'Sora', sans-serif" }}>
            {counts.upnext || 0}
          </p>
          <p className="text-[10px] text-sky-600 font-medium mt-0.5">Up next</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-red-600" style={{ fontFamily: "'Sora', sans-serif" }}>
            {counts.overdue || 0}
          </p>
          <p className="text-[10px] text-red-500 font-medium mt-0.5">Overdue</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-2xl p-3 text-center">
          <p className="text-xl font-bold text-gray-600 dark:text-slate-300" style={{ fontFamily: "'Sora', sans-serif" }}>
            {historyBills.length}
          </p>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">History</p>
        </div>
      </div>

      <Card className="space-y-3">
        <input
          type="search"
          placeholder="Search by name\u2026"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700"
          >
            <option value="">All categories</option>
            <option value="EMI">EMI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Subscription">Subscription</option>
            <option value="Insurance">Insurance</option>
            <option value="SIP">SIP</option>
            <option value="Rent">Rent</option>
            <option value="Loan">Loan</option>
            <option value="Utility">Utility</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700"
          >
            <option value="">All statuses</option>
            <option value="pending">Due now</option>
            <option value="upnext">Up next</option>
            <option value="overdue">Overdue</option>
            <option value="paid">Paid</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700"
          >
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterPreset}
            onChange={(e) => setFilterPreset(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 sm:col-span-2"
          >
            <option value="">All types</option>
            <option value="recurring">Recurring only</option>
            <option value="subscriptions">Subscriptions</option>
            <option value="loans_emi">EMI / Loan</option>
            <option value="overdue_only">Overdue</option>
            <option value="upcoming">Upcoming (14d)</option>
            <option value="high_remaining">High remaining (&ge;15k)</option>
            <option value="high_pressure">High monthly burden</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 sm:col-span-1"
          >
            <option value="priority_due">Sort: priority + due</option>
            <option value="due_soonest">Due soonest</option>
            <option value="burden_desc">Highest burden</option>
            <option value="remaining_desc">Highest remaining</option>
            <option value="priority">Priority only</option>
          </select>
        </div>
      </Card>

      {sortedCommitments.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-4xl mb-3" aria-hidden>
            {"\uD83D\uDCCB"}
          </p>
          <p className="font-semibold text-gray-600 dark:text-slate-300">{COPY.noBills}</p>
          <p className="text-sm text-gray-400 mt-1">Tap + {COPY.addBill} above to create your first one</p>
        </Card>
      )}

      {sortedCommitments.length > 0 && activeBills.length === 0 && (
        <Card className="text-center py-8 text-sm text-gray-500">No active bills match your filters.</Card>
      )}

      <div className="space-y-3">
        {activeBills.map((item) => {
          const eff = item.effectiveStatus;
          const { label, classes } = BILL_STATUS_UI[eff] || BILL_STATUS_UI.pending;
          const isOverdue = eff === "overdue";
          const remaining = Number(item.remainingAmount ?? 0);
          const total = Number(item.amount ?? 0);
          const partial = eff !== "paid" && remaining > 0 && remaining < total;

          return (
            <Card
              key={item.id}
              className={`space-y-3 ${isOverdue ? "border-red-100 bg-red-50/60" : ""}`}
            >
              <button
                type="button"
                onClick={() => setDetailFor(item)}
                className="w-full text-left flex items-start justify-between gap-2 rounded-lg -m-1 p-1 hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="space-y-2 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-slate-100">{getBillDisplayName(item)}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryChip categoryId={item.category} />
                    <PriorityBadge priorityId={item.priority} />
                    {item.repeatType !== "none" && (
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        {repeatTypeLabel(item.repeatType)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {item.startDate ? `Started ${formatDate(item.startDate)}` : null}
                    {item.startDate && item.endDate ? " \u2192 " : item.startDate ? " \u00b7 " : ""}
                    {item.endDate ? `Ends ${formatDate(item.endDate)}` : item.startDate ? "Ongoing" : ""}
                    {" \u00b7 "}Due {formatDate(item.dueDate)}
                    {item.notes ? <span className="block mt-1 text-gray-500">{item.notes}</span> : null}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {"\u20b9"}
                    {total.toLocaleString()}
                  </p>
                  {partial && (
                    <p className="text-xs text-amber-700 font-medium">
                      Remaining {"\u20b9"}
                      {remaining.toLocaleString()}
                    </p>
                  )}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${classes}`}>{label}</span>
                </div>
              </button>

              {(eff === "pending" || eff === "overdue") && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => openPayment(item)}
                    className="flex-1 min-w-[120px] py-2 text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all active:scale-95"
                  >
                    Add payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCommitment(item.id)}
                    className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              )}

            </Card>
          );
        })}
      </div>

      {historyBills.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-600 dark:text-slate-400 py-2"
          >
            <span>History ({historyBills.length})</span>
            <span aria-hidden>{showHistory ? "\u25b2" : "\u25bc"}</span>
          </button>
          {showHistory && (
            <div className="space-y-2 mt-2">
              {historyBills.map((item) => (
                <Card key={item.id} className="space-y-2 opacity-90">
                  <button
                    type="button"
                    onClick={() => setDetailFor(item)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-700 dark:text-slate-300 truncate">{getBillDisplayName(item)}</p>
                      <p className="text-xs text-gray-400">
                        Paid {"\u00b7"} due {formatDate(item.dueDate)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 shrink-0">Paid</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCommitment(item.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {paymentFor && (
        <Modal
          title="Record payment"
          onClose={() => setPaymentFor(null)}
          footer={
            <div>
              <button
                type="button"
                onClick={submitPayment}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
              >
                Add amount
              </button>
              <button
                type="button"
                onClick={payRemaining}
                disabled={Number(paymentFor.remainingAmount) <= 0}
                className="flex-1 py-2.5 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl disabled:opacity-40"
              >
                Simulate UPI pay ({"\u20b9"}
                {Number(paymentFor.remainingAmount).toLocaleString()})
              </button>
            </div>
          }
        >
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{paymentFor.name}</span> {"\u2014"} remaining{" "}
              <span className="font-bold">
                {"\u20b9"}
                {Number(paymentFor.remainingAmount).toLocaleString()}
              </span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Amount ({"\u20b9"})</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}

      {detailFor && (
        <BillDetailModal
          bill={detailFor}
          todayStr={todayStr}
          displayStatus={getEffectiveStatus(detailFor)}
          onClose={() => setDetailFor(null)}
          onEdit={(bill) => {
            setDetailFor(null);
            setEditing(bill);
          }}
          onAddPayment={(bill) => {
            setDetailFor(null);
            openPayment(bill);
          }}
          onDelete={(id) => {
            setDetailFor(null);
            deleteCommitment(id);
          }}
        />
      )}

      {editing && (
        <CommitmentEditModal
          key={editing.id}
          commitment={editing}
          onClose={() => setEditing(null)}
          onSave={(id, patch) => updateCommitment(id, patch)}
        />
      )}
    </div>
  );
};

export default Commitments;
