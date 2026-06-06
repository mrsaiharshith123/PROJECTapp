import { useMemo } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { buildLendingDashboard } from "../../../utils/lendingFinancials.js";
import { buildLendingTimeline } from "../../../utils/lendingTimeline.js";
import { lendingTrustByPerson, trustSummaryLine } from "../../../engines/lendingTrust.js";
import { sealAndDownloadAgreement } from "../../../utils/agreementExport.js";
import { canEditLending, repaymentModeLabel } from "../../../engines/lendingAgreement.js";
import { Button } from "../../index.js";
import {
  generateLendingShareCardHtml,
  lendingSharePlainText,
  openHtmlInNewTab,
} from "../../../utils/lendingShareCard.js";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { ProgressBar } from "../../patterns/ProgressBar.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import { ToneSurface } from "../../patterns/ToneSurface.jsx";

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
  const { user } = useAuth();
  const dash = useMemo(
    () => buildLendingDashboard(lending, settings),
    [lending, settings]
  );
  const timeline = useMemo(() => buildLendingTimeline(lending), [lending]);
  const trustRow = lendingTrustByPerson(allLendings).find(
    (r) => r.personKey === String(lending.personName || "").trim().toLowerCase()
  );

  const salaryWarn = dash.salaryImpactPercent >= 40;
  const termsLocked = !canEditLending(lending);
  const inputClass = inputClassName();
  const trustStatusClass =
    dash.trustScore >= 80
      ? "ct-status-success"
      : dash.trustScore >= 60
        ? "ct-status-neutral"
        : dash.trustScore >= 40
          ? "ct-status-warning"
          : "ct-status-danger";

  return (
    <div className="ct-stack">
      <div className="ct-row-wrap">
        <span className={`ct-status ${trustStatusClass}`}>
          Trust {dash.trustScore}/100
        </span>
        {lending.relationshipTag && (
          <span className="ct-status ct-status-neutral">{lending.relationshipTag}</span>
        )}
      </div>

      <section className="ct-stat-grid">
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
        <div className="ct-row-between ct-caption mb-1">
          <span>Repayment progress</span>
          <span>{dash.paidPct}% paid</span>
        </div>
        <ProgressBar value={dash.paidPct} />
        <Caption className="block mt-1">
          Installments {dash.installmentProgress.paid}/{dash.installmentProgress.total}
        </Caption>
      </section>

      {settings.monthlyIncome > 0 && (
        <ToneSurface tone={salaryWarn ? "warning" : "neutral"}>
          <Caption>
            Salary impact: <strong>{dash.salaryImpactPercent}%</strong> of monthly income per installment
            {salaryWarn && " — consider easing other dues this month."}
          </Caption>
        </ToneSurface>
      )}

      {trustRow && (
        <Caption className="ct-inset block px-3 py-2 rounded-lg">{trustSummaryLine(trustRow)}</Caption>
      )}

      <section>
        <Body className="text-xs font-semibold mb-2">Payment history</Body>
        {(lending.payments || []).length === 0 ? (
          <Caption>No payments recorded yet.</Caption>
        ) : (
          <ul className="ct-scroll-list">
            {(lending.payments || []).map((p, i) => (
              <li key={i} className="ct-caption border-b border-[var(--ct-border)] pb-1">
                <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span> · {p.date}
                {p.onTime === false && <span className="ct-text-warning ml-1">Late</span>}
                {(p.principalPortion > 0 || p.interestPortion > 0) && (
                  <span className="block">
                    P ₹{p.principalPortion || 0} · I ₹{p.interestPortion || 0}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <Body className="text-xs font-semibold mb-2">Timeline</Body>
        <ol className="ct-timeline">
          {timeline.map((ev) => (
            <li key={ev.id} className="ct-caption">
              <span className="block">{new Date(ev.createdAt).toLocaleDateString("en-IN")}</span>
              {ev.message}
            </li>
          ))}
        </ol>
      </section>

      <div className="ct-row-wrap">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="flex-1 min-w-[120px]"
          onClick={onSimulatePay}
          disabled={Number(lending.remainingAmount) <= 0}
        >
          Record payment
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 min-w-[120px]"
          onClick={() =>
            sealAndDownloadAgreement({ ...lending, agreementText: agreementDraft }, settings, user?.id)
          }
        >
          Print agreement
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 min-w-[120px]"
          onClick={async () => {
            openHtmlInNewTab(generateLendingShareCardHtml(lending, settings));
            await shareOrCopyPlainText(lendingSharePlainText(lending, settings), {
              title: "CommitTrack lending summary",
            });
          }}
        >
          Share summary
        </Button>
      </div>

      <Caption>{repaymentModeLabel(lending)}</Caption>

      {!lending.agreementAccepted && !termsLocked && (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={onAcceptAgreement}>
          Mark agreement accepted (local record)
        </Button>
      )}

      {termsLocked && (
        <ToneSurface tone="warning">
          <Caption>
            Agreement is locked after both parties accepted. You can still record payments until the loan is settled.
          </Caption>
        </ToneSurface>
      )}

      <textarea
        className={`${inputClass} min-h-[64px] w-full`}
        value={agreementDraft}
        onChange={(e) => setAgreementDraft(e.target.value)}
        placeholder="Custom clauses for printable agreement"
        disabled={termsLocked}
        readOnly={termsLocked}
      />
      {!termsLocked && (
        <button
          type="button"
          onClick={() => updateLending(lending.id, { agreementText: agreementDraft })}
          className="ct-btn ct-btn-ghost ct-btn-sm"
        >
          Save agreement notes
        </button>
      )}

      <ProofSection fileRef={fileRef} proofs={lending.proofs} onAddProof={onAddProof} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="ct-stat-cell">
      <p className="ct-stat-cell-label">{label}</p>
      <p className="ct-stat-cell-value">{value}</p>
    </div>
  );
}

function ProofSection({ fileRef, proofs, onAddProof }) {
  return (
    <div>
      <div className="ct-row-between">
        <Body className="text-xs font-semibold">Proof vault</Body>
        <button type="button" onClick={() => fileRef.current?.click()} className="ct-btn ct-btn-ghost ct-btn-sm">
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
        <Caption className="block mt-1">No proofs yet.</Caption>
      ) : (
        <ul className="ct-stack-sm mt-1">
          {(proofs || []).map((p, i) => (
            <li key={i} className="ct-caption">
              {p.label || "Proof"} · {p.date}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
