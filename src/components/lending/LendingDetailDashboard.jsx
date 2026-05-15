import { useMemo } from "react";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { buildLendingDashboard } from "../../utils/lendingFinancials.js";
import { buildLendingTimeline } from "../../utils/lendingTimeline.js";
import { lendingTrustByPerson, trustSummaryLine, trustBadgeClass } from "../../engines/lendingTrust.js";
import { downloadLendingAgreementHtml } from "../../utils/agreementExport.js";

function ProgressBar({ pct, className = "bg-indigo-500" }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function LendingDetailDashboard({
  lending,
  agreementDraft,
  setAgreementDraft,
  onSimulatePay,
  onAcceptAgreement,
  fileRef,
  onAddProof,
}) {
  const { settings, updateLending, allLendings } = useCommitTrack();
  const dash = useMemo(
    () => buildLendingDashboard(lending, settings),
    [lending, settings]
  );
  const timeline = useMemo(() => buildLendingTimeline(lending), [lending]);
  const trustRow = lendingTrustByPerson(allLendings).find(
    (r) => r.personKey === String(lending.personName || "").trim().toLowerCase()
  );

  const salaryWarn = dash.salaryImpactPercent >= 40;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${trustBadgeClass(dash.trustScore)}`}>
          Trust {dash.trustScore}/100
        </span>
        {lending.relationshipTag && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{lending.relationshipTag}</span>
        )}
      </div>

      <section className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Principal" value={`₹${Number(lending.principalAmount ?? lending.totalAmount).toLocaleString()}`} />
        <Stat label="Interest rate" value={`${lending.interestRate ?? 0}% · ${lending.interestType || "simple"}`} />
        <Stat label="Total payable" value={`₹${Number(lending.totalPayable || lending.totalAmount).toLocaleString()}`} />
        <Stat label="Interest" value={`₹${Number(lending.interestAmount || 0).toLocaleString()}`} />
        <Stat label="Installment" value={`₹${Number(lending.expectedInstallment || 0).toLocaleString()}`} />
        <Stat label="Next due" value={`₹${Number(lending.nextDueAmount ?? lending.remainingAmount).toLocaleString()}`} />
        <Stat label="Remaining" value={`₹${Number(lending.remainingBalance ?? lending.remainingAmount).toLocaleString()}`} />
        <Stat label="Duration" value={`${lending.startDate || "—"} → ${lending.endDate || "—"}`} />
      </section>

      <section>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Repayment progress</span>
          <span>{dash.paidPct}% paid</span>
        </div>
        <ProgressBar pct={dash.paidPct} className="bg-emerald-500" />
        <p className="text-[11px] text-gray-400 mt-1">
          Installments {dash.installmentProgress.paid}/{dash.installmentProgress.total}
        </p>
      </section>

      {settings.monthlyIncome > 0 && (
        <section
          className={`rounded-xl px-3 py-2 text-xs ${salaryWarn ? "bg-amber-50 text-amber-900 border border-amber-100" : "bg-gray-50 text-gray-700"}`}
        >
          Salary impact: <strong>{dash.salaryImpactPercent}%</strong> of monthly income per installment
          {salaryWarn && " — consider easing other dues this month."}
        </section>
      )}

      {trustRow && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{trustSummaryLine(trustRow)}</p>
      )}

      <section>
        <h3 className="text-xs font-semibold text-gray-700 mb-2">Payment history</h3>
        {(lending.payments || []).length === 0 ? (
          <p className="text-xs text-gray-400">No payments recorded yet.</p>
        ) : (
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {(lending.payments || []).map((p, i) => (
              <li key={i} className="text-xs border-b border-gray-50 pb-1">
                <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span> · {p.date}
                {p.onTime === false && <span className="text-amber-600 ml-1">Late</span>}
                {(p.principalPortion > 0 || p.interestPortion > 0) && (
                  <span className="block text-gray-400">
                    P ₹{p.principalPortion || 0} · I ₹{p.interestPortion || 0}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold text-gray-700 mb-2">Timeline</h3>
        <ol className="border-l-2 border-indigo-100 pl-3 space-y-2 max-h-36 overflow-y-auto">
          {timeline.map((ev) => (
            <li key={ev.id} className="text-xs text-gray-600">
              <span className="text-gray-400 block">{new Date(ev.createdAt).toLocaleDateString("en-IN")}</span>
              {ev.message}
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSimulatePay}
          disabled={Number(lending.remainingAmount) <= 0}
          className="flex-1 min-w-[120px] py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg disabled:opacity-40"
        >
          Simulate Pay via UPI
        </button>
        <button
          type="button"
          onClick={() => downloadLendingAgreementHtml({ ...lending, agreementText: agreementDraft }, settings)}
          className="flex-1 min-w-[120px] py-2 text-xs font-semibold border border-gray-200 rounded-lg"
        >
          Print agreement
        </button>
      </div>

      {!lending.agreementAccepted && (
        <button
          type="button"
          onClick={onAcceptAgreement}
          className="w-full py-2 text-xs font-semibold text-indigo-700 border border-indigo-200 rounded-lg"
        >
          Mark agreement accepted (local record)
        </button>
      )}

      <textarea
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm min-h-[64px]"
        value={agreementDraft}
        onChange={(e) => setAgreementDraft(e.target.value)}
        placeholder="Custom clauses for printable agreement"
      />
      <button
        type="button"
        onClick={() => updateLending(lending.id, { agreementText: agreementDraft })}
        className="text-xs font-semibold text-indigo-600"
      >
        Save agreement notes
      </button>

      <ProofSection fileRef={fileRef} proofs={lending.proofs} onAddProof={onAddProof} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <p className="text-gray-400">{label}</p>
      <p className="font-semibold text-gray-800 truncate">{value}</p>
    </div>
  );
}

function ProofSection({ fileRef, proofs, onAddProof }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-600">Proof vault</label>
        <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-semibold text-indigo-600">
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAddProof(f);
            e.target.value = "";
          }}
        />
      </div>
      {(proofs || []).length === 0 ? (
        <p className="text-xs text-gray-400 mt-1">No proofs yet.</p>
      ) : (
        <ul className="mt-1 text-xs text-gray-600 space-y-0.5">
          {(proofs || []).map((p, i) => (
            <li key={i}>
              {p.label || "Proof"} · {p.date}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
