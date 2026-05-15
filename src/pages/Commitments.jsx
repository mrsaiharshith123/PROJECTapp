import { useMemo, useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import Card from "../components/Card";
import CategoryChip from "../components/CategoryChip.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import CommitmentEditModal from "../components/CommitmentEditModal.jsx";
import { Modal } from "../components/Modal.jsx";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { todayYmd } from "../utils/dates.js";
import { monthlyBurdenForCommitment } from "../engines/burden.js";
import { priorityRank } from "../constants/priority.js";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const statusConfig = {
  paid: { label: "Paid", classes: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  pending: { label: "Pending", classes: "bg-amber-100 text-amber-700 border border-amber-200" },
  overdue: { label: "Overdue", classes: "bg-red-100 text-red-600 border border-red-200" },
};

const Commitments = () => {
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
  const [editing, setEditing] = useState(null);
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

  const counts = useMemo(() => {
    return withEffective.reduce(
      (acc, c) => {
        acc[c.effectiveStatus] = (acc[c.effectiveStatus] || 0) + 1;
        return acc;
      },
      { paid: 0, pending: 0, overdue: 0 }
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
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Monthly</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Commitments
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600" style={{ fontFamily: "'Sora', sans-serif" }}>
            {counts.paid || 0}
          </p>
          <p className="text-xs text-emerald-500 font-medium mt-0.5">Paid</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600" style={{ fontFamily: "'Sora', sans-serif" }}>
            {counts.pending || 0}
          </p>
          <p className="text-xs text-amber-500 font-medium mt-0.5">Pending</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600" style={{ fontFamily: "'Sora', sans-serif" }}>
            {counts.overdue || 0}
          </p>
          <p className="text-xs text-red-400 font-medium mt-0.5">Overdue</p>
        </div>
      </div>

      <Card className="space-y-3">
        <input
          type="search"
          placeholder="Search by name…"
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
            <option value="pending">Pending</option>
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
            <option value="high_remaining">High remaining (≥15k)</option>
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
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-gray-600">No commitments yet</p>
          <p className="text-sm text-gray-400 mt-1">Tap Add to create your first one</p>
        </Card>
      )}

      {sortedCommitments.length > 0 && filtered.length === 0 && (
        <Card className="text-center py-8 text-sm text-gray-500">No items match your filters.</Card>
      )}

      <div className="space-y-3">
        {filtered.map((item) => {
          const eff = item.effectiveStatus;
          const { label, classes } = statusConfig[eff] || statusConfig.pending;
          const isOverdue = eff === "overdue";
          const remaining = Number(item.remainingAmount ?? 0);
          const total = Number(item.amount ?? 0);
          const partial = eff !== "paid" && remaining > 0 && remaining < total;

          return (
            <Card
              key={item.id}
              className={`space-y-3 ${isOverdue ? "border-red-100 bg-red-50/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 min-w-0">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryChip categoryId={item.category} />
                    <PriorityBadge priorityId={item.priority} />
                    {item.repeatType !== "none" && (
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        {item.repeatType}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Due {formatDate(item.dueDate)}
                    {item.notes ? <span className="block mt-1 text-gray-500">{item.notes}</span> : null}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <p className="font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>
                    ₹{total.toLocaleString()}
                  </p>
                  {partial && (
                    <p className="text-xs text-amber-700 font-medium">
                      Remaining ₹{remaining.toLocaleString()}
                    </p>
                  )}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${classes}`}>{label}</span>
                </div>
              </div>

              {eff !== "paid" && (
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

              {eff === "paid" && (
                <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                  <div className="flex-1 py-2 text-xs font-semibold text-center text-emerald-600 bg-emerald-50 rounded-lg">
                    Cycle complete
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(item)}
                    className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg"
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
                Simulate UPI pay (₹{Number(paymentFor.remainingAmount).toLocaleString()})
              </button>
            </div>
          }
        >
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{paymentFor.name}</span> — remaining{" "}
              <span className="font-bold">₹{Number(paymentFor.remainingAmount).toLocaleString()}</span>
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹)</label>
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
