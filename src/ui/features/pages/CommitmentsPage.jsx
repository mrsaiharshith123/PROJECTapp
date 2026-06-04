import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Card, Modal, PageHeader, Fab, FilterChips, CountTile, inputClassName, BillCard, Caption } from "../../";
import CommitmentEditModal from "../../features/modals/CommitmentEditModal.jsx";
import BillDetailModal from "../../features/modals/BillDetailModal.jsx";
import SmsDetectModal from "../../features/modals/SmsDetectModal.jsx";
import { COPY } from "../../../constants/copy.js";
import { isActiveBill, isHistoryBill } from "../../../utils/billLifecycle.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { todayYmd } from "../../../utils/dates.js";
import { monthlyBurdenForCommitment } from "../../../engines/burden.js";
import { computeBillPaymentProgress } from "../../../utils/billPaymentProgress.js";
import {
  isCurrentCyclePaid,
  suggestedCyclePaymentAmount,
} from "../../../utils/commitmentPayments.js";
import { computeContractPaymentLedger } from "../../../utils/billPaymentProgress.js";
import { priorityRank } from "../../../constants/priority.js";

const Commitments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    sortedCommitments,
    commitments,
    getEffectiveStatus,
    addCommitmentPayment,
    deleteCommitment,
    updateCommitment,
    todayStr,
  } = useCommitTrack();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState(() =>
    searchParams.get("filter") === "Subscription" ? "Subscription" : "",
  );
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterPreset, setFilterPreset] = useState("");
  const [sortBy, setSortBy] = useState("priority_due");
  const [showHistory, setShowHistory] = useState(true);
  const [editing, setEditing] = useState(null);
  const [detailFor, setDetailFor] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [payDate, setPayDate] = useState(() => todayYmd());
  const [smsOpen, setSmsOpen] = useState(false);

  /** @type {Array<import('../../../types/context.js').AuthProfile & { effectiveStatus: string }>} */
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
      list = list.filter((i) => Number(i.amount ?? i.remainingAmount ?? 0) >= 15000);
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

  const activeBills = useMemo(
    () => filtered.filter((c) => isActiveBill(c, getEffectiveStatus, todayStr)),
    [filtered, getEffectiveStatus, todayStr]
  );
  const historyBills = useMemo(() => {
    let list = withEffective.filter((c) => isHistoryBill(c, getEffectiveStatus, todayStr));
    if (search) list = list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    if (filterCategory) list = list.filter((i) => i.category === filterCategory);
    return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [withEffective, search, filterCategory, getEffectiveStatus, todayStr]);

  const counts = useMemo(() => {
    return withEffective.filter((c) => isActiveBill(c, getEffectiveStatus, todayStr)).reduce(
      (acc, c) => {
        acc[c.effectiveStatus] = (acc[c.effectiveStatus] || 0) + 1;
        return acc;
      },
      { paid: 0, pending: 0, overdue: 0, upnext: 0 }
    );
  }, [withEffective, getEffectiveStatus, todayStr]);

  const openPayment = (item) => {
    setPaymentFor(item);
    setPayDate(todayYmd());
  };

  const payOneCycle = () => {
    if (!paymentFor) return;
    const amt = suggestedCyclePaymentAmount(paymentFor, todayStr, sortedCommitments);
    if (amt <= 0) return;
    addCommitmentPayment(paymentFor.id, { amount: amt, date: payDate });
    setPaymentFor(null);
  };

  const installmentAmount = paymentFor
    ? suggestedCyclePaymentAmount(paymentFor, todayStr, sortedCommitments)
    : 0;
  const contractStillToPay = paymentFor
    ? (computeContractPaymentLedger(paymentFor, todayStr, sortedCommitments).remainingToPay ?? 0)
    : 0;
  const cycleAlreadyPaid =
    paymentFor && isCurrentCyclePaid(paymentFor, todayStr, sortedCommitments);

  const presetChips = [
    { id: "", label: "All" },
    { id: "upcoming", label: "Due Soon" },
    { id: "overdue_only", label: "Overdue" },
    { id: "paid", label: "Paid" },
  ];

  return (
    <div className="ct-page">
      <PageHeader
        title={COPY.billsPageTitle}
        eyebrow="Monthly"
        actions={
          <>
            <button
              type="button"
              className="ct-btn ct-btn-ghost ct-btn-sm"
              aria-label="Detect from SMS"
              onClick={() => setSmsOpen(true)}
            >
              📱
            </button>
            <Fab type="button" onClick={() => navigate("/add")} aria-label={COPY.addBill}>
              +
            </Fab>
          </>
        }
      />
      <SmsDetectModal open={smsOpen} onClose={() => setSmsOpen(false)} />

      <FilterChips
        options={presetChips}
        value={filterPreset === "overdue_only" ? "overdue_only" : filterPreset === "upcoming" ? "upcoming" : filterStatus === "paid" ? "paid" : ""}
        onChange={(id) => {
          if (id === "overdue_only") {
            setFilterPreset("overdue_only");
            setFilterStatus("");
          } else if (id === "upcoming") {
            setFilterPreset("upcoming");
            setFilterStatus("");
          } else if (id === "paid") {
            setFilterPreset("");
            setFilterStatus("paid");
          } else {
            setFilterPreset("");
            setFilterStatus("");
          }
        }}
      />

      <div className="ct-grid-4">
        <CountTile value={counts.pending || 0} label="Due" tone="warning" />
        <CountTile value={counts.upnext || 0} label="Up next" tone="info" />
        <CountTile value={counts.overdue || 0} label="Overdue" tone="critical" />
        <CountTile value={historyBills.length} label="History" onClick={() => setShowHistory((v) => !v)} />
      </div>

      <Card className="ct-stack">
        <input
          type="search"
          placeholder="Search by name\u2026"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClassName()}
        />
        <div className="ct-grid-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={inputClassName("text-xs font-medium")}
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
            className={inputClassName("text-xs font-medium")}
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
            className={inputClassName("text-xs font-medium")}
          >
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterPreset}
            onChange={(e) => setFilterPreset(e.target.value)}
            className={inputClassName("text-xs font-medium sm:col-span-2")}
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
            className={inputClassName("text-xs font-medium sm:col-span-1")}
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
        <Card className="ct-stack-center" style={{ padding: "3rem 1.25rem", textAlign: "center" }}>
          <p className="text-4xl mb-3" aria-hidden>
            {"\uD83D\uDCCB"}
          </p>
          <p className="ct-body-strong">{COPY.noBills}</p>
          <Caption>Tap + {COPY.addBill} above to create your first one</Caption>
        </Card>
      )}

      {sortedCommitments.length > 0 && activeBills.length === 0 && (
        <Card className="ct-stack-center" style={{ padding: "2rem 1.25rem", textAlign: "center" }}>
          <Caption>No active bills match your filters.</Caption>
        </Card>
      )}

      <div className="ct-stack">
        {activeBills.map((item) => {
          const eff = item.effectiveStatus;
          const total = Number(item.amount ?? 0);
          const cycleDue = suggestedCyclePaymentAmount(item, todayStr, commitments);
          const partial = (eff === "pending" || eff === "overdue") && cycleDue > 0 && cycleDue < total;
          const monthPaid = eff === "paid";
          const progress = computeBillPaymentProgress(item, todayStr, commitments);

          return (
            <BillCard
              key={item.id}
              item={item}
              effectiveStatus={eff}
              cycleDue={cycleDue}
              partial={partial}
              monthPaid={monthPaid}
              progress={progress}
              onOpen={() => setDetailFor(item)}
              onPay={() => openPayment(item)}
              onEdit={() => setEditing(item)}
              onDelete={() => deleteCommitment(item.id)}
            />
          );
        })}
      </div>

      {historyBills.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowHistory((v) => !v)} className="ct-bill-card-head ct-body-strong">
            <span>History ({historyBills.length})</span>
            <span aria-hidden>{showHistory ? "\u25b2" : "\u25bc"}</span>
          </button>
          {showHistory && (
            <div className="ct-stack-sm mt-2">
              {historyBills.map((item) => {
                const hp = computeBillPaymentProgress(item, todayStr, commitments);
                return (
                  <BillCard
                    key={item.id}
                    variant="history"
                    item={item}
                    effectiveStatus="paid"
                    cycleDue={0}
                    partial={false}
                    monthPaid={false}
                    progress={hp}
                    onOpen={() => setDetailFor(item)}
                    onPay={() => {}}
                    onEdit={() => setEditing(item)}
                    onDelete={() => deleteCommitment(item.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {paymentFor && (
        <Modal
          title="Pay this month"
          onClose={() => setPaymentFor(null)}
          footer={
            <button
              type="button"
              onClick={payOneCycle}
              disabled={installmentAmount <= 0 || cycleAlreadyPaid}
              className="w-full py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40"
            >
              Simulate UPI pay ({"\u20b9"}
              {installmentAmount.toLocaleString("en-IN")})
            </button>
          }
        >
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">{paymentFor.name}</span>
              {contractStillToPay > installmentAmount && installmentAmount > 0 ? (
                <>
                  {" "}
                  {"\u2014"} total left on contract{" "}
                  <span className="font-bold">
                    {"\u20b9"}
                    {contractStillToPay.toLocaleString("en-IN")}
                  </span>
                  {" "}
                  · paying this month{" "}
                  <span className="font-bold">
                    {"\u20b9"}
                    {installmentAmount.toLocaleString("en-IN")}
                  </span>
                </>
              ) : (
                <>
                  {" "}
                  {"\u2014"} this payment{" "}
                  <span className="font-bold">
                    {"\u20b9"}
                    {installmentAmount.toLocaleString("en-IN")}
                  </span>
                </>
              )}
            </p>
            {cycleAlreadyPaid ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 mt-3">
                Already paid for this month. You can pay again when the next due date starts.
              </p>
            ) : (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Installment (fixed)</label>
                <p
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-lg font-bold text-gray-900"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {"\u20b9"}
                  {installmentAmount.toLocaleString("en-IN")}
                </p>
              </div>
            )}
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
          allCommitments={sortedCommitments}
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
