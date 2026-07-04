import { useCallback, useRef, useState } from "react";
import { recognizeTextFromImage, extractBillData } from "../../../utils/billOcr.js";
import { classifyMerchant } from "../../../utils/merchantNormalize.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { Button, Caption, Body, Heading, Stack } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { trackEvent, EVENTS } from "../../../services/analytics/perovoAnalytics.js";
import { isNativeCapacitorShell, pickBillImageNative } from "../../../utils/nativeMediaPicker.js";

export default function BillScannerTool() {
  const { t } = useTranslation();
  const { addCommitment } = usePerovo();
  const fileRef = useRef(null);
  const [stage, setStage] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [extracted, setExtracted] = useState(null);
  const [name, setName] = useState("");
  const [success, setSuccess] = useState(false);
  const [ocrEngine, setOcrEngine] = useState(null);
  const [permError, setPermError] = useState("");
  const nativeShell = isNativeCapacitorShell();

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setStage("scanning");
      setProgress(0);
      setOcrEngine(null);
      setPermError("");
      try {
        const { text, engine } = await recognizeTextFromImage(file, setProgress);
        setOcrEngine(engine);
        const data = extractBillData(text);
        const merchant = classifyMerchant(data.merchantHint, data.category);
        const suggested =
          merchant.label || data.merchantHint.split(" ").slice(0, 3).join(" ") || t("tools.billScanner.defaultName");
        setExtracted({
          amount: data.amount || "",
          dueDate: data.dueDate || "",
          category: data.category,
          suggestedName: suggested,
        });
        setName(suggested);
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
    addCommitment({
      name: name || extracted.suggestedName,
      amount: extracted.amount,
      category: extracted.category,
      dueDate: extracted.dueDate,
      repeatType: "monthly",
    });
    trackEvent(EVENTS.BILL_SCANNED, { category: extracted.category });
    setSuccess(true);
    setTimeout(() => {
      setStage("idle");
      setExtracted(null);
      setSuccess(false);
    }, 2000);
  };

  return (
    <div className="ed-stack">
      <Heading level={3}>{t("tools.billScanner.title")}</Heading>
      <Caption>{t("tools.billScanner.intro")}</Caption>

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
              <button
                type="button"
                className="ed-scan-drop-zone w-full"
                onClick={() => fileRef.current?.click()}
              >
                <span className="ed-icon-tile indigo mx-auto mb-2 inline-flex" aria-hidden>
                  <CtIcon name="receipt" size={28} />
                </span>
                <Body>{t("tools.billScanner.tapPhoto")}</Body>
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
          <Caption className="block mt-2" style={{ color: "var(--ed-ink-faint)" }}>
            {progress < 30
              ? t("tools.billScanner.stageLoad")
              : progress < 70
                ? t("tools.billScanner.stageOcr")
                : t("tools.billScanner.stageExtract")}
          </Caption>
        </div>
      )}

      {stage === "result" && extracted && (
        <div className="ed-stack">
          <ToolAnswerHero
            tone="pressure"
            label={t("tools.billScanner.amount")}
            value={extracted.amount ? formatInr(extracted.amount) : t("tools.billScanner.notFound")}
          />
          <Stack gap="sm">
            {ocrEngine ? (
              <Caption className="block">
                {ocrEngine === "vision"
                  ? t("tools.billScanner.scannedHighAccuracy")
                  : t("tools.billScanner.scannedOffline")}
              </Caption>
            ) : null}
            <Caption>{t("tools.billScanner.found")}</Caption>
            <div className="ed-grid-2">
              <div>
                <Caption>{t("tools.billScanner.billName")}</Caption>
                <input
                  className="ed-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("tools.billScanner.namePlaceholder")}
                />
              </div>
              <div>
                <Caption>{t("tools.billScanner.dueDate")}</Caption>
                <Body>{extracted.dueDate || t("tools.billScanner.notFound")}</Body>
              </div>
              <div>
                <Caption>{t("tools.billScanner.category")}</Caption>
                <Body>{extracted.category}</Body>
              </div>
            </div>
            <Caption>{t("tools.billScanner.reviewHint")}</Caption>
            <div className="ed-row gap-2">
              <Button type="button" variant="primary" onClick={handleAdd} className="flex-1">
                {t("tools.billScanner.addToBills")}
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
          <Body style={{ color: "var(--ed-green)" }}>{t("tools.billScanner.added")}</Body>
        </div>
      )}
    </div>
  );
}
