import { useCallback, useRef, useState } from "react";
import { recognizeTextFromImage, extractInsurancePolicyData } from "../../../utils/documentScanners.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { Button, Caption, Body, Heading, Stack } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateCategory } from "../../../i18n/domainLabels.js";
import { trackEvent, EVENTS } from "../../../services/analytics/perovoAnalytics.js";
import { isNativeCapacitorShell, pickBillImageNative } from "../../../utils/nativeMediaPicker.js";

/** Photo of an insurance policy -> pre-filled Insurance commitment, cross-referenced for coverage gap. */
export default function InsurancePolicyScannerTool() {
  const { t } = useTranslation();
  const { addCommitment } = usePerovo();
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
        const data = extractInsurancePolicyData(text);
        setExtracted(data);
        setName(data.insurer ? `${data.insurer} — ${translateCategory(t, "Insurance")}` : translateCategory(t, "Insurance"));
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
    const repeatType = extracted.frequency === "monthly" ? "monthly" : "yearly";
    addCommitment({
      name: name || translateCategory(t, "Insurance"),
      amount: extracted.premium || 0,
      category: "Insurance",
      repeatType,
      insuranceCompany: extracted.insurer || "",
      insurancePolicyId: extracted.policyNumber || "",
      insuranceSumAssured: extracted.sumAssured || undefined,
      insuranceTermYears: extracted.termYears || undefined,
      insurancePremiumFrequency: extracted.frequency,
    });
    trackEvent(EVENTS.BILL_SCANNED, { category: "insurance_policy" });
    setSuccess(true);
    setTimeout(() => {
      setStage("idle");
      setExtracted(null);
      setSuccess(false);
    }, 2000);
  };

  return (
    <div className="ed-stack">
      <Heading level={3}>{t("tools.insuranceScanner.title")}</Heading>
      <Caption>{t("tools.insuranceScanner.intro")}</Caption>

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
                  <CtIcon name="umbrella" size={28} />
                </span>
                <Body>{t("tools.insuranceScanner.tapPhoto")}</Body>
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
            label={t("tools.insuranceScanner.sumAssured")}
            value={extracted.sumAssured ? formatInr(extracted.sumAssured) : t("tools.billScanner.notFound")}
          />
          <Stack gap="sm">
            <Caption>{t("tools.billScanner.found")}</Caption>
            <div className="ed-grid-2">
              <div>
                <Caption>{t("tools.insuranceScanner.name")}</Caption>
                <input className="ed-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Caption>{t("tools.insuranceScanner.premium")}</Caption>
                <Body>{extracted.premium ? formatInr(extracted.premium) : t("tools.billScanner.notFound")}</Body>
              </div>
              <div>
                <Caption>{t("tools.insuranceScanner.term")}</Caption>
                <Body>{extracted.termYears != null ? t("tools.insuranceScanner.termYears", { count: extracted.termYears }) : t("tools.billScanner.notFound")}</Body>
              </div>
              <div>
                <Caption>{t("tools.insuranceScanner.nominee")}</Caption>
                <Body>{extracted.hasNominee ? extracted.nomineeName : t("tools.billScanner.notFound")}</Body>
              </div>
            </div>
            {!extracted.hasNominee ? (
              <Caption style={{ color: "var(--ed-amber)" }}>{t("tools.insuranceScanner.noNomineeWarning")}</Caption>
            ) : null}
            <Caption>{t("tools.billScanner.reviewHint")}</Caption>
            <div className="ed-row gap-2">
              <Button type="button" variant="primary" onClick={handleAdd} className="flex-1">
                {t("tools.insuranceScanner.addPolicy")}
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
          <Body style={{ color: "var(--ed-green)" }}>{t("tools.insuranceScanner.added")}</Body>
        </div>
      )}
    </div>
  );
}
