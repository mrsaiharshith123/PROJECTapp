import { useMemo, useState } from "react";
import Card from "../Card.jsx";
import InfoTip from "../InfoTip.jsx";
import { CALC_HELP } from "../../constants/calculationHelp.js";
import { formatInr } from "../../constants/symbols.js";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { isInvoiceOverdue } from "../../utils/businessInvoices.js";
import { todayYmd } from "../../utils/dates.js";

function formatDue(d) {
  if (!d) return "—";
  return new Date(d + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Business mode: lending receivables + client invoices (local). */
export default function BusinessCashflowPanel({ business }) {
  const {
    businessInvoices,
    addBusinessInvoice,
    deleteBusinessInvoice,
    markBusinessInvoicePaid,
    todayStr,
  } = useCommitTrack();

  const [clientName, setClientName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const openInvoices = useMemo(
    () => businessInvoices.filter((i) => !i.paid),
    [businessInvoices]
  );
  const invoiceOpenTotal = useMemo(
    () => openInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0),
    [openInvoices]
  );
  const overdueCount = useMemo(
    () => openInvoices.filter((i) => isInvoiceOverdue(i, todayStr || todayYmd())).length,
    [openInvoices, todayStr]
  );

  const handleAdd = (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!clientName.trim() || amt <= 0 || !dueDate) return;
    addBusinessInvoice({ clientName: clientName.trim(), amount: amt, dueDate, notes: notes.trim() });
    setClientName("");
    setAmount("");
    setDueDate("");
    setNotes("");
  };

  if (!business) return null;

  return (
    <Card className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 inline-flex items-center">
        Business cashflow
        <InfoTip text={CALC_HELP.businessReceivables} />
      </h2>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Lending receivables</p>
          <p className="font-semibold">{formatInr(business.totalReceivables)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Client invoices open</p>
          <p className="font-semibold">{formatInr(invoiceOpenTotal)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Vendor dues</p>
          <p className="font-semibold">{formatInr(business.vendorDue)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Stability</p>
          <p className="font-semibold">{business.stabilityLabel}</p>
        </div>
      </div>

      {overdueCount > 0 && (
        <p className="text-xs text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-200 rounded-lg px-3 py-2">
          {overdueCount} invoice{overdueCount > 1 ? "s" : ""} past due — follow up for cashflow.
        </p>
      )}

      <form onSubmit={handleAdd} className="space-y-2 border-t border-gray-100 dark:border-slate-700 pt-3">
        <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">Add client invoice</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Client name"
            className="w-full px-3 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 text-sm"
          />
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (₹)"
            className="w-full px-3 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 text-sm"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 text-sm"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
        >
          Save invoice
        </button>
      </form>

      {businessInvoices.length > 0 && (
        <ul className="space-y-2 text-sm">
          {businessInvoices.slice(0, 8).map((inv) => {
            const overdue = isInvoiceOverdue(inv, todayStr || todayYmd());
            return (
              <li
                key={inv.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 border ${
                  inv.paid
                    ? "bg-gray-50 border-gray-100 opacity-70"
                    : overdue
                      ? "bg-amber-50 border-amber-100"
                      : "bg-white border-gray-100"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{inv.clientName}</p>
                  <p className="text-xs text-gray-500">
                    Due {formatDue(inv.dueDate)}
                    {inv.paid ? " · Paid" : overdue ? " · Overdue" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold">{formatInr(inv.amount)}</span>
                  {!inv.paid && (
                    <button
                      type="button"
                      onClick={() => markBusinessInvoicePaid(inv.id)}
                      className="text-xs text-emerald-700 font-semibold"
                    >
                      Paid
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteBusinessInvoice(inv.id)}
                    className="text-xs text-gray-400"
                    aria-label="Remove invoice"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
