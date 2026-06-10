import { useMemo } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { buildLendingDashboard } from "../../../utils/lendingFinancials.js";
import { buildLendingTimeline } from "../../../utils/lendingTimeline.js";
import { lendingTrustByPerson, trustSummaryLine } from "../../../engines/lendingTrust.js";
import { sealAndDownloadAgreement } from "../../../utils/agreementExport.js";
import { canEditLending } from "../../../engines/lendingAgreement.js";
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
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateRepaymentMode } from "../../../i18n/domainLabels.js";
import { tierHasFeature } from "../../../utils/tierAccess.js";
import { useNavigate } from "react-router-dom";

export default function LendingDetailDashboard({
  lending,
  agreementDraft,
  setAgreementDraft,
  onSimulatePay,
  onAcceptAgreement,
  fileRef,
  onAddProof,
}) {
  const { t } = useTranslation();
  const { settings, updateLending, allLendings } = useCommitTrack();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canPrintAgreement = tierHasFeature("legal_agreement", settings);
  const dash = useMemo(
    () => buildLendingDashboard(lending, settings),
    [lending, settings],
  );
  const timeline = useMemo(() => buildLendingTimeline(lending), [lending]);
  const trustRow = lendingTrustByPerson(allLendings).find(
    (r) => r.personKey === String(lending.personName || "").trim().toLowerCase(),
  );

  const salaryWarn = dash.salaryImpactPercent >= 40;
  const termsLocked = !canEditLending(lending);
  const fieldClass = inputClassName();
  const trustStatusClass =
    dash.trustScore >= 80
      ? "ct-status-success"
      : dash.trustScore >= 60
        ? "ct-status-neutral"
        : dash.trustScore >= 40
          ? "ct-status-warning"
          : "ct-status-danger";

  const interestTypeLabel =
    lending.interestType === "simple" ? t("lending.detail.interestSimple") : lending.interestType || "";

  return (
    <div className="ct-stack">
      <div className="ct-row-wrap">
        <span className={`ct-status ${trustStatusClass}`}>
          {t("lending.detail.trust", { score: dash.trustScore })}
        </span>
        {lending.relationshipTag && (
          <span className="ct-status ct-status-neutral">{lending.relationshipTag}</span>
        )}
      </div>

      <section className="ct-stat-grid">
        <Stat label={t("lending.detail.principal")} value={`₹${Number(lending.principalAmount ?? lending.totalAmount).toLocaleString()}`} />
        <Stat
          label={t("lending.detail.interestRate")}
          value={`${lending.interestRate ?? 0}% · ${interestTypeLabel}`}
        />
        <Stat label={t("lending.detail.totalPayable")} value={`₹${Number(lending.totalPayable || lending.totalAmount).toLocaleString()}`} />
        <Stat label={t("lending.detail.interest")} value={`₹${Number(lending.interestAmount || 0).toLocaleString()}`} />
        <Stat label={t("lending.detail.installment")} value={`₹${Number(lending.expectedInstallment || 0).toLocaleString()}`} />
        <Stat label={t("lending.detail.nextDue")} value={`₹${Number(lending.nextDueAmount ?? lending.remainingAmount).toLocaleString()}`} />
        <Stat label={t("lending.detail.remaining")} value={`₹${Number(lending.remainingBalance ?? lending.remainingAmount).toLocaleString()}`} />
        <Stat
          label={t("lending.detail.duration")}
          value={`${lending.startDate || "—"} → ${lending.endDate || "—"}`}
        />
      </section>

      <section>
        <div className="ct-row-between ct-caption mb-1">
          <span>{t("lending.detail.repaymentProgress")}</span>
          <span>{t("lending.detail.paidPct", { percent: dash.paidPct })}</span>
        </div>
        <ProgressBar value={dash.paidPct} />
        <Caption className="block mt-1">
          {t("lending.detail.installments", {
            paid: dash.installmentProgress.paid,
            total: dash.installmentProgress.total,
          })}
        </Caption>
      </section>

      {settings.monthlyIncome > 0 && (
        <ToneSurface tone={salaryWarn ? "warning" : "neutral"}>
          <Caption>
            {t("lending.detail.salaryImpact", { percent: dash.salaryImpactPercent })}
            {salaryWarn && t("lending.detail.salaryWarn")}
          </Caption>
        </ToneSurface>
      )}

      {trustRow && (
        <Caption className="ct-inset block px-3 py-2 rounded-lg">{trustSummaryLine(trustRow)}</Caption>
      )}

      <section>
        <Body className="text-xs font-semibold mb-2">{t("lending.detail.paymentHistory")}</Body>
        {(lending.payments || []).length === 0 ? (
          <Caption>{t("lending.detail.noPayments")}</Caption>
        ) : (
          <ul className="ct-scroll-list">
            {(lending.payments || []).map((p, i) => (
              <li key={i} className="ct-caption border-b border-[var(--ct-border)] pb-1">
                <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span> · {p.date}
                {p.onTime === false && <span className="ct-text-warning ml-1">{t("lending.detail.late")}</span>}
                {(p.principalPortion > 0 || p.interestPortion > 0) && (
                  <span className="block">
                    {t("lending.detail.principalInterest", {
                      principal: p.principalPortion || 0,
                      interest: p.interestPortion || 0,
                    })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <Body className="text-xs font-semibold mb-2">{t("lending.detail.timeline")}</Body>
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
          className="flex-1 min-w-0"
          onClick={onSimulatePay}
          disabled={Number(lending.remainingAmount) <= 0}
        >
          {t("lending.detail.recordPayment")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 min-w-0"
          onClick={() => {
            if (!canPrintAgreement) {
              navigate("/profile#upgrade");
              return;
            }
            sealAndDownloadAgreement({ ...lending, agreementText: agreementDraft }, settings, user?.id);
          }}
        >
          {t("lending.detail.printAgreement")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 min-w-0"
          onClick={async () => {
            openHtmlInNewTab(generateLendingShareCardHtml(lending, settings));
            await shareOrCopyPlainText(lendingSharePlainText(lending, settings), {
              title: t("lending.detail.shareTitle"),
            });
          }}
        >
          {t("lending.detail.shareSummary")}
        </Button>
      </div>

      <Caption>{translateRepaymentMode(t, lending.repaymentType || lending.repaymentFrequency)}</Caption>

      {!lending.agreementAccepted && !termsLocked && (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={onAcceptAgreement}>
          {t("lending.detail.acceptAgreement")}
        </Button>
      )}

      {termsLocked && (
        <ToneSurface tone="warning">
          <Caption>{t("lending.detail.lockedNote")}</Caption>
        </ToneSurface>
      )}

      <textarea
        className={`${fieldClass} min-h-[64px] w-full`}
        value={agreementDraft}
        onChange={(e) => setAgreementDraft(e.target.value)}
        placeholder={t("lending.detail.phClauses")}
        disabled={termsLocked}
        readOnly={termsLocked}
      />
      {!termsLocked && (
        <button
          type="button"
          onClick={() => updateLending(lending.id, { agreementText: agreementDraft })}
          className="ct-btn ct-btn-ghost ct-btn-sm"
        >
          {t("lending.detail.saveAgreement")}
        </button>
      )}

      <ProofSection fileRef={fileRef} proofs={lending.proofs} onAddProof={onAddProof} t={t} />
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

function ProofSection({ fileRef, proofs, onAddProof, t }) {
  return (
    <div>
      <div className="ct-row-between">
        <Body className="text-xs font-semibold">{t("lending.detail.proofVault")}</Body>
        <button type="button" onClick={() => fileRef.current?.click()} className="ct-btn ct-btn-ghost ct-btn-sm">
          {t("lending.detail.upload")}
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
        <Caption className="block mt-1">{t("lending.detail.noProofs")}</Caption>
      ) : (
        <ul className="ct-stack-sm mt-1">
          {(proofs || []).map((p, i) => (
            <li key={i} className="ct-caption">
              {p.label || t("lending.detail.proofLabel")} · {p.date}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
