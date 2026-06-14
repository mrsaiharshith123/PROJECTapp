import { useMemo, useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { buildLendingDashboard } from "../../../utils/lendingFinancials.js";
import { buildLendingTimeline } from "../../../utils/lendingTimeline.js";
import { lendingTrustByPerson, trustSummaryLine } from "../../../engines/lendingTrust.js";
import { sealAndDownloadAgreement, generateAgreementPdfBase64 } from "../../../utils/agreementExport.js";
import { canEditLending } from "../../../engines/lendingAgreement.js";
import { Button, Card } from "../../index.js";
import {
  generateLendingShareCardHtml,
  lendingSharePlainText,
  openHtmlInNewTab,
} from "../../../utils/lendingShareCard.js";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { LendingDetailCharts } from "./LendingDetailCharts.jsx";
import LendingActionFlow from "./LendingActionFlow.jsx";
import LegalDetailsModal from "../modals/LegalDetailsModal.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import { ToneSurface } from "../../patterns/ToneSurface.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateRepaymentMode } from "../../../i18n/domainLabels.js";
import { tierHasFeature } from "../../../utils/tierAccess.js";
import { useNavigate } from "react-router-dom";
import {
  isESignConfigured,
  createLeegalityDocument,
  checkLeegalityStatus,
  buildESignFallbackNoteKey,
} from "../../../services/lending/leegalityESign.js";
import { getStampGuidance, ESTAMP_RESOURCES } from "../../../utils/estampGuidance.js";
import { formatInr } from "../../../constants/symbols.js";

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
  const [legalOpen, setLegalOpen] = useState(false);
  const [stampOpen, setStampOpen] = useState(false);
  const [esignLoading, setEsignLoading] = useState(false);
  const [esignError, setEsignError] = useState("");
  const [esignUrl, setEsignUrl] = useState("");
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

  const stampState = lending.agreementCity || settings.userCity || "";
  const stampNote = getStampGuidance(stampState).note;

  const handleStartESign = async () => {
    if (!lending.borrowerFullName || !lending.borrowerPhone) {
      setEsignError(t("lending.esign.missingDetails"));
      return;
    }
    setEsignLoading(true);
    setEsignError("");
    const pdfBase64 = await generateAgreementPdfBase64({ ...lending, agreementText: agreementDraft }, settings);
    const result = await createLeegalityDocument({
      pdfBase64,
      signerName: lending.borrowerFullName,
      signerEmail: lending.borrowerEmail || "",
      signerPhone: lending.borrowerPhone,
      documentTitle: t("lending.esign.documentTitle", {
        name: lending.personName,
        amount: formatInr(Number(lending.principalAmount) || 0),
      }),
    });
    setEsignLoading(false);
    if (result.error) {
      setEsignError(result.error);
      return;
    }
    updateLending(lending.id, {
      esignStatus: "pending",
      esignDocumentId: result.documentId,
      esignProvider: "leegality",
    });
    if (result.signingUrl) window.open(result.signingUrl, "_blank", "noopener,noreferrer");
    setEsignUrl(result.signingUrl || "");
  };

  const handleCheckEsign = async () => {
    const status = await checkLeegalityStatus(lending.esignDocumentId);
    if (status?.status === "COMPLETED") {
      updateLending(lending.id, {
        esignStatus: "completed",
        esignCompletedAt: status.completedAt || new Date().toISOString(),
      });
    }
  };

  return (
    <div className="ct-stack">
      <LendingActionFlow
        lending={lending}
        settings={settings}
        onScrollToEsign={() => document.getElementById("lending-esign-section")?.scrollIntoView({ behavior: "smooth" })}
      />

      <div className="ct-row-wrap">
        <span className={`ct-status ${trustStatusClass}`}>
          {t("lending.detail.trust", { score: dash.trustScore })}
        </span>
        {lending.relationshipTag && (
          <span className="ct-status ct-status-neutral">{lending.relationshipTag}</span>
        )}
      </div>

      <Caption className="block opacity-90">
        {t("lending.detail.interestRate")}: {lending.interestRate ?? 0}% · {interestTypeLabel}
        {" · "}
        {t("lending.detail.duration")}: {lending.startDate || "—"} → {lending.endDate || "—"}
        {" · "}
        {t("lending.detail.paidPct", { percent: dash.paidPct })}
        {" · "}
        {t("lending.detail.installments", {
          paid: dash.installmentProgress.paid,
          total: dash.installmentProgress.total,
        })}
      </Caption>

      <LendingDetailCharts lending={lending} />

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

      {!lending.borrowerFullName ? (
        <ToneSurface tone="warning">
          <Caption className="block">{t("lending.legal.incompletePrompt")}</Caption>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setLegalOpen(true)}>
            {t("lending.legal.openModal")}
          </Button>
        </ToneSurface>
      ) : null}

      <section id="lending-esign-section" className="ct-stack-sm">
        <Body className="text-xs font-semibold">{t("lending.esign.title")}</Body>
        {lending.esignStatus === "completed" ? (
          <ToneSurface tone="success">
            <Caption className="block">{t("lending.esign.completed")}</Caption>
            <Caption className="block">
              {lending.esignCompletedAt || "—"} · {lending.esignDocumentId || "—"}
            </Caption>
          </ToneSurface>
        ) : isESignConfigured() ? (
          <Card className="ct-stack-sm">
            <Caption className="block">{t("lending.esign.explainer")}</Caption>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={esignLoading || !lending.borrowerFullName || !lending.borrowerPhone}
              onClick={handleStartESign}
            >
              {esignLoading ? t("common.loading") : t("lending.esign.startCta")}
            </Button>
            {esignUrl ? (
              <Button type="button" variant="outline" size="sm" onClick={handleCheckEsign}>
                {t("lending.esign.checkStatus")}
              </Button>
            ) : null}
          </Card>
        ) : (
          <Caption className="block">{t(buildESignFallbackNoteKey())}</Caption>
        )}
        {esignError ? (
          <ToneSurface tone="danger">
            <Caption>{esignError}</Caption>
          </ToneSurface>
        ) : null}
      </section>

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

      <div className="ct-stack-sm">
        <button type="button" className="ct-link text-left" onClick={() => setStampOpen((v) => !v)}>
          {t("lending.stamp.toggle")}
        </button>
        {stampOpen ? (
          <Card className="ct-stack-sm">
            <Caption className="font-semibold block">{t("lending.stamp.requiredTitle")}</Caption>
            <Body className="!text-sm">{stampNote}</Body>
            <div className="ct-row-wrap gap-2">
              {ESTAMP_RESOURCES.map((res) => (
                <Button
                  key={res.url}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(res.url, "_blank", "noopener,noreferrer")}
                >
                  {t(res.labelKey)}
                </Button>
              ))}
            </div>
            <Caption className="block">{t("lending.stamp.footer")}</Caption>
          </Card>
        ) : null}
      </div>

      <ProofSection fileRef={fileRef} proofs={lending.proofs} onAddProof={onAddProof} t={t} />
      <LegalDetailsModal lending={lending} open={legalOpen} onClose={() => setLegalOpen(false)} />
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
