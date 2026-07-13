import { useCallback, useRef, useState } from "react";
import { recognizeTextFromImage, extractLoanSanctionData } from "../../../utils/documentScanners.js";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { Button, Caption, Body, Heading, Stack } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { trackEvent, EVENTS } from "../../../services/analytics/perovoAnalytics.js";
import { isNativeCapacitorShell, pickBillImageNative } from "../../../utils/nativeMediaPicker.js";

const LOAN_TYPE_LABEL_KEYS = {
  home_loan: "netWorth.liability.homeLoan",
  vehicle_loan: "netWorth.liability.vehicleLoan",
  education_loan: "netWorth.liability.educationLoan",
  business_debt: "netWorth.liability.businessDebt",
  personal_loan: "netWorth.liability.personalLoan",
};

/** Photo of a loan sanction letter -> pre-filled liability entry — same OCR pipeline as BillScannerTool. */
export default function LoanSanctionScannerTool() {
  const { t } = useTranslation();
  const { addEntry } = useNetWorth();
  const fileRef = useRef(null);
  const [stage, setStage] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [extracted, setExtracted] = useState(null);
  const [name, setName] = useState("");
  const [success, setSuccess] = useState(false);
  const [permError, setPermError] = useState("");
  const nativeShell = isNativeCapacitorShell();

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setStage("scanning");
      setProgress(0);
      setPermError("");
      try {
        const { text } = await recognizeTextFromImage(file, setProgress);
        const data = extractLoanSanctionData(text);
        const suggested = t(LOAN_TYPE_LABEL_KEYS[data.loanType] || LOAN_TYPE_LABEL_KEYS.personal_loan);
        setExtracted(data);
        setName(data.lender ? `${suggested} — ${data.lender}` : suggested);
        setStage("result");
      } catch {
        setStage("idle");
      }
    },
    [t],
  );

  const pickNative = useCallback(
    async (source) => {
      try {
        setPermError("");
        const file = await pickBillImageNative(source);
        if (file) await handleFile(file);
      } catch (err) {
        if (err instanceof Error && err.message === "permission_denied") {
          setPermError(t("tools.billScanner.permissionDenied"));
        }
      }
    },
    [handleFile, t],
  );

  const handleAdd = () => {
    if (!extracted) return;
    setStage("adding");
    addEntry({
      kind: "liability",
      categoryId: extracted.loanType,
      name: name || t(LOAN_TYPE_LABEL_KEYS[extracted.loanType] || LOAN_TYPE_LABEL_KEYS.personal_loan),
      value: extracted.principal || 0,
      originalLoanAmount: extracted.principal || undefined,
      interestRate: extracted.interestRate || undefined,
      emi: extracted.emi || undefined,
    });
    trackEvent(EVENTS.BILL_SCANNED, { category: "loan_sanction", loanType: extracted.loanType });
    setSuccess(true);
    setTimeout(() => {
      setStage("idle");
      setExtracted(null);
      setSuccess(false);
    }, 2000);
  };

  return (
    <div className="ed-stack">
      <Heading level={3}>{t("tools.loanScanner.title")}</Heading>
      <Caption>{t("tools.loanScanner.intro")}</Caption>

      {stage === "idle" && (
        <>
          {nativeShell ? (
            <div className="ed-row gap-2">
              <button type="button" className="ed-btn ed-btn-primary flex-1" onClick={() => pickNative("camera")}>
                {t("tools.billScanner.useCamera")}
              </button>
              <button type="button" className="ed-btn ed-btn-outline flex-1" onClick={() => pickNative("gallery")}>
                {t("tools.billScanner.useGallery")}
              </button>
            </div>
          ) : (
            <>
              <button type="button" className="ed-scan-drop-zone w-full" onClick={() => fileRef.current?.click()}>
                <span className="ed-icon-tile indigo mx-auto mb-2 inline-flex" aria-hidden>
                  <CtIcon name="file-text" size={28} />
                </span>
                <Body>{t("tools.loanScanner.tapPhoto")}</Body>
                <Caption>{t("tools.billScanner.orGallery")}</Caption>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </>
          )}
          {permError ? <Caption style={{ color: "var(--ed-amber)" }}>{permError}</Caption> : null}
        </>
      )}

      {stage === "scanning" && (
        <div className="ed-inset ed-stack-sm !p-3">
          <Caption>{t("tools.billScanner.reading", { pct: progress })}</Caption>
          <div className="ed-progress-track">
            <div className="ed-progress-fill ed-bar-animated" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {stage === "result" && extracted && (
        <div className="ed-stack">
          <ToolAnswerHero
            tone="pressure"
            label={t("tools.loanScanner.principal")}
            value={extracted.principal ? formatInr(extracted.principal) : t("tools.billScanner.notFound")}
          />
          <Stack gap="sm">
            <Caption>{t("tools.billScanner.found")}</Caption>
            <div className="ed-grid-2">
              <div>
                <Caption>{t("tools.loanScanner.name")}</Caption>
                <input className="ed-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Caption>{t("tools.loanScanner.rate")}</Caption>
                <Body>{extracted.interestRate != null ? `${extracted.interestRate}%` : t("tools.billScanner.notFound")}</Body>
              </div>
              <div>
                <Caption>{t("tools.loanScanner.tenure")}</Caption>
                <Body>{extracted.tenureMonths != null ? t("tools.loanScanner.tenureMonths", { count: extracted.tenureMonths }) : t("tools.billScanner.notFound")}</Body>
              </div>
              <div>
                <Caption>{t("tools.loanScanner.emi")}</Caption>
                <Body>{extracted.emi ? formatInr(extracted.emi) : t("tools.billScanner.notFound")}</Body>
              </div>
            </div>
            <Caption>{t("tools.billScanner.reviewHint")}</Caption>
            <div className="ed-row gap-2">
              <Button type="button" variant="primary" onClick={handleAdd} className="flex-1">
                {t("tools.loanScanner.addLiability")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStage("idle");
                  setExtracted(null);
                }}
              >
                {t("tools.billScanner.scanAgain")}
              </Button>
            </div>
          </Stack>
        </div>
      )}

      {success && (
        <div className="ed-inset !p-3">
          <Body style={{ color: "var(--ed-green)" }}>{t("tools.loanScanner.added")}</Body>
        </div>
      )}
    </div>
  );
}
