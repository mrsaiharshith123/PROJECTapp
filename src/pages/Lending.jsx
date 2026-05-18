import { useMemo, useState } from "react";
import Card from "../components/Card";
import { formatInr } from "../constants/symbols.js";
import { buildLendingRecord } from "../utils/lendingRecord.js";
import { Modal } from "../components/Modal.jsx";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { getEffectiveLendingStatus } from "../utils/lendingStatus.js";
import { todayYmd } from "../utils/dates.js";
import { lendingTrustByPerson, trustSummaryLine, trustScoreForLendingEntry, trustBadgeClass } from "../engines/lendingTrust.js";
import LendingDetailModal from "../components/LendingDetailModal.jsx";
import LendingFormFields from "../components/lending/LendingFormFields.jsx";
import LendingRequestModal from "../components/lending/LendingRequestModal.jsx";
import { canDeleteLending, canEditLending, repaymentModeLabel } from "../engines/lendingAgreement.js";

const emptyLendingForm = () => ({
  personName: "",
  type: "lent",
  totalAmount: "",
  dueDate: "",
  startDate: "",
  endDate: "",
  interestRate: "0",
  interestType: "simple",
  repaymentFrequency: "monthly",
  repaymentType: "monthly",
  relationshipTag: "Other",
  notes: "",
});

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const lendingStatusStyle = {
  pending: { label: "Pending", classes: "bg-amber-100 text-amber-700 border-amber-200" },
  overdue: { label: "Overdue", classes: "bg-red-100 text-red-700 border-red-200" },
  complete: { label: "Settled", classes: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

function avatarFor(name) {
  const s = String(name || "?").trim();
  return (s[0] || "?").toUpperCase();
}

const Lending = () => {
  const { lendings, todayStr, addLending, updateLending, deleteLending, addLendingPayment } = useCommitTrack();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [form, setForm] = useState(emptyLendingForm);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(() => todayYmd());
  const [formErrors, setFormErrors] = useState({});
  const [detailFor, setDetailFor] = useState(null);
  const [showRequest, setShowRequest] = useState(false);

  const sortLendings = (list) =>
    [...list].sort((a, b) => {
      const da = a.dueDate || "";
      const db = b.dueDate || "";
      if (da !== db) return da.localeCompare(db);
      return String(a.personName).localeCompare(String(b.personName));
    });

  const borrowedList = useMemo(() => sortLendings(lendings.filter((l) => l.type === "borrowed")), [lendings]);
  const lentList = useMemo(() => sortLendings(lendings.filter((l) => l.type === "lent")), [lendings]);

  const trustRows = useMemo(() => lendingTrustByPerson(lendings), [lendings]);

  const totals = useMemo(() => {
    let lentOut = 0;
    let borrowedIn = 0;
    let recovered = 0;
    let repaid = 0;
    for (const l of lendings) {
      const total = Number(l.totalAmount) || 0;
      const rem = Number(l.remainingAmount) || 0;
      const paid = total - rem;
      if (l.type === "lent") {
        lentOut += rem;
        recovered += paid;
      } else {
        borrowedIn += rem;
        repaid += paid;
      }
    }
    return { lentOut, borrowedIn, recovered, repaid };
  }, [lendings]);

  const resetForm = () => {
    setForm(emptyLendingForm());
    setFormErrors({});
  };

  const validateForm = () => {
    const errs = {};
    if (!form.personName.trim()) errs.personName = "Name is required";
    if (!form.totalAmount || Number(form.totalAmount) <= 0) errs.totalAmount = "Enter a valid amount";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    if (form.interestRate === "" || Number.isNaN(Number(form.interestRate))) {
      errs.interestRate = "Interest rate is required";
    } else if (Number(form.interestRate) < 0 || Number(form.interestRate) > 60) {
      errs.interestRate = "Rate must be 0–60%";
    }
    return errs;
  };

  const lendingPayload = () =>
    buildLendingRecord({
      type: form.type,
      personName: form.personName.trim(),
      totalAmount: form.totalAmount,
      dueDate: form.dueDate,
      interestRate: form.interestRate,
      notes: form.notes.trim(),
      relationshipTag: form.relationshipTag,
      extra: {
        startDate: form.startDate || form.dueDate,
        endDate: form.endDate,
        interestType: form.interestType,
        repaymentFrequency: form.repaymentFrequency,
        repaymentType: form.repaymentType,
      },
    });

  const submitAdd = () => {
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    addLending(lendingPayload());
    resetForm();
    setShowAdd(false);
  };

  const submitEdit = () => {
    if (!editing) return;
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      return;
    }
    updateLending(editing.id, lendingPayload());
    resetForm();
    setEditing(null);
  };

  const openEdit = (l) => {
    if (!canEditLending(l)) return;
    setEditing(l);
    setForm({
      personName: l.personName,
      type: l.type,
      totalAmount: String(l.principalAmount ?? l.totalAmount),
      dueDate: l.dueDate || "",
      startDate: l.startDate || l.dueDate || "",
      endDate: l.endDate || "",
      interestRate: String(l.interestRate ?? 0),
      interestType: l.interestType || "simple",
      repaymentFrequency: l.repaymentFrequency || l.repaymentType || "monthly",
      repaymentType: l.repaymentType || "monthly",
      relationshipTag: l.relationshipTag || "Other",
      notes: l.notes || "",
    });
    setFormErrors({});
  };

  const openPayment = (l) => {
    setPaymentFor(l);
    setPayAmount("");
    setPayDate(todayYmd());
  };

  const submitPayment = () => {
    if (!paymentFor) return;
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return;
    addLendingPayment(paymentFor.id, { amount: amt, date: payDate });
    setPaymentFor(null);
  };

  const payRemaining = () => {
    if (!paymentFor) return;
    const rem = Number(paymentFor.remainingAmount) || 0;
    if (rem <= 0) return;
    addLendingPayment(paymentFor.id, { amount: rem, date: payDate });
    setPaymentFor(null);
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
      formErrors[field] ? "border-red-300" : "border-gray-200"
    }`;

  const renderEntry = (item) => {
    const eff = getEffectiveLendingStatus(item, todayStr);
    const cfg = lendingStatusStyle[eff] || lendingStatusStyle.pending;
    const trust = trustScoreForLendingEntry(item);
    return (
      <Card key={item.id} className={eff === "overdue" ? "border-red-100 bg-red-50/50" : ""}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold bg-indigo-100 text-indigo-700 shrink-0">
              {avatarFor(item.personName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-800">{item.personName}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${trustBadgeClass(trust)}`}>
                  {trust}/100
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Due {formatDate(item.dueDate)} · {repaymentModeLabel(item)}
              </p>
              {item.agreementAccepted && item.agreementLocked && eff !== "complete" && (
                <p className="text-[10px] text-amber-700 mt-0.5">Agreement locked — record payments only</p>
              )}
              {item.notes ? <p className="text-xs text-gray-400 mt-1">{item.notes}</p> : null}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>
              {formatInr(item.totalAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Left {formatInr(item.remainingAmount)}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-semibold border ${cfg.classes}`}>
              {cfg.label}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {eff !== "complete" && (
            <button type="button" onClick={() => openPayment(item)} className="flex-1 min-w-[100px] py-2 text-xs font-semibold bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
              Payment
            </button>
          )}
          <button type="button" onClick={() => setDetailFor(item)} className="px-3 py-2 text-xs font-semibold border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50">
            Details
          </button>
          {canEditLending(item) ? (
            <button
              type="button"
              onClick={() => openEdit(item)}
              className="px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Edit
            </button>
          ) : null}
          {canDeleteLending(item) ? (
            <button type="button" onClick={() => deleteLending(item.id)} className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
              Delete
            </button>
          ) : (
            <span className="px-2 py-2 text-[10px] text-amber-700" title="Locked until repaid or both sign to cancel">
              Locked
            </span>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Tracker</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
            Money
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            Request money goes under debt; when someone accepts your link it shows as money lent.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowRequest(true)}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
          >
            Request money
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center p-4">
          <p className="text-xs text-gray-400 mb-1">You lent (outstanding)</p>
          <p className="text-lg font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>
            {formatInr(totals.lentOut)}
          </p>
        </Card>
        <Card className="text-center p-4 bg-violet-50 border-violet-100">
          <p className="text-xs text-violet-600 mb-1">You owe (debt)</p>
          <p className="text-lg font-bold text-violet-800" style={{ fontFamily: "'Sora', sans-serif" }}>
            {formatInr(totals.borrowedIn)}
          </p>
        </Card>
        <Card className="text-center p-4 bg-emerald-50 border-emerald-100">
          <p className="text-xs text-emerald-600 mb-1">Recovered (lent)</p>
          <p className="text-lg font-bold text-emerald-700" style={{ fontFamily: "'Sora', sans-serif" }}>
            {formatInr(totals.recovered)}
          </p>
        </Card>
        <Card className="text-center p-4 bg-slate-50 border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Repaid (debt)</p>
          <p className="text-lg font-bold text-slate-700" style={{ fontFamily: "'Sora', sans-serif" }}>
            {formatInr(totals.repaid)}
          </p>
        </Card>
      </div>

      {borrowedList.length === 0 && lentList.length === 0 && (
        <Card className="text-center py-10 text-sm text-gray-500">
          Nothing here yet. Request money (debt) or Add and pick lent / borrowed.
        </Card>
      )}

      {borrowedList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-violet-800 uppercase tracking-wide">Money you owe (debt)</h2>
          {borrowedList.map(renderEntry)}
        </section>
      )}

      {lentList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-indigo-800 uppercase tracking-wide">Money you lent</h2>
          {lentList.map(renderEntry)}
        </section>
      )}

      {trustRows.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800">Relationship notes (local)</h2>
          <p className="text-xs text-gray-500">Based on repayments vs due dates. Private to this device.</p>
          {trustRows.slice(0, 8).map((row) => (
            <p key={row.personKey} className="text-xs text-gray-700 border-b border-gray-50 last:border-0 pb-2 last:pb-0">
              {trustSummaryLine(row)}
            </p>
          ))}
        </Card>
      )}

      {showAdd && (
        <Modal
          title="Add lending entry"
          onClose={() => {
            setShowAdd(false);
            resetForm();
          }}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 bg-white"
                onClick={() => {
                  setShowAdd(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl"
                onClick={submitAdd}
              >
                Save
              </button>
            </div>
          }
        >
                    <div className="space-y-4">
            <LendingFormFields
              form={form}
              setForm={setForm}
              formErrors={formErrors}
              inputClass={inputClass}
              todayStr={todayStr}
            />
          </div>
        </Modal>
      )}

      {editing && (
        <Modal
          title="Edit lending entry"
          onClose={() => {
            setEditing(null);
            resetForm();
          }}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl"
                onClick={() => {
                  setEditing(null);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl"
                onClick={submitEdit}
              >
                Save
              </button>
            </div>
          }
        >
                    <div className="space-y-4">
            <LendingFormFields
              form={form}
              setForm={setForm}
              formErrors={formErrors}
              inputClass={inputClass}
              todayStr={todayStr}
            />
          </div>
        </Modal>
      )}

      {showRequest && <LendingRequestModal onClose={() => setShowRequest(false)} />}

      {detailFor && <LendingDetailModal lending={detailFor} onClose={() => setDetailFor(null)} />}

      {paymentFor && (
        <Modal
          title="Record repayment"
          onClose={() => setPaymentFor(null)}
          footer={
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={submitPayment}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl"
              >
                Add amount
              </button>
              <button
                type="button"
                onClick={payRemaining}
                disabled={Number(paymentFor.remainingAmount) <= 0}
                className="flex-1 py-2.5 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl disabled:opacity-40"
              >
                Pay full balance (₹{Number(paymentFor.remainingAmount).toLocaleString()})
              </button>
            </div>
          }
        >
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{paymentFor.personName}</span> — remaining{" "}
              <span className="font-bold">₹{Number(paymentFor.remainingAmount).toLocaleString()}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {repaymentModeLabel(paymentFor)}. You can log a partial amount or pay the full balance in one go.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
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
    </div>
  );
};

export default Lending;
