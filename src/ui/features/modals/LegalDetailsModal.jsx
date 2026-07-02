import { useState } from "react";
import { Modal, Button, Caption, Heading, Body, inputClassName, ToneSurface } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { isKycConfigured, verifyPan } from "../../../services/lending/kycVerification.js";
import { lookupIfsc } from "../../../services/market/ifscLookup.js";

const ID_PROOF_TYPES = ["Aadhaar", "PAN", "Voter ID", "Passport", "Driving Licence"];
const inputClass = `${inputClassName()} ct-input-tint`;

const STEPS = [
  { id: "borrower", titleKey: "lending.legal.step.borrower", subKey: "lending.legal.step.borrowerSub" },
  { id: "esign", titleKey: "lending.legal.step.esign", subKey: "lending.legal.step.esignSub" },
  { id: "estamp", titleKey: "lending.legal.step.estamp", subKey: "lending.legal.step.estampSub" },
];

function LegalStepper({ activeStep, panVerified }) {
  const { t } = useTranslation();
  return (
    <div className="ct-legal-stepper-v" role="list" aria-label={t("lending.legal.modalTitle")}>
      {STEPS.map((step, idx) => {
        const done = idx < activeStep || (idx === 0 && panVerified && activeStep > 0);
        const active = idx === activeStep;
        const stateClass = done ? "ct-legal-step-v-done" : active ? "ct-legal-step-v-active" : "";
        return (
          <div key={step.id} className={`ct-legal-step-v ${stateClass}`} role="listitem">
            <span className="ct-legal-step-v-marker" aria-hidden>
              {done ? <CtIcon name="check" size={14} /> : idx + 1}
            </span>
            <div className="ct-legal-step-v-body">
              <p className="ct-legal-step-v-title">{t(step.titleKey)}</p>
              <p className="ct-legal-step-v-sub">{t(step.subKey)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * @param {{ lending: object, open: boolean, onClose: () => void, onComplete?: () => void }} props
 */
export default function LegalDetailsModal({ lending, open, onClose, onComplete }) {
  const { t } = useTranslation();
  const { settings, updateLending } = usePerovo();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    borrowerFullName: lending.borrowerFullName || "",
    borrowerAddress: lending.borrowerAddress || "",
    borrowerPhone: lending.borrowerPhone || "",
    borrowerBankIfsc: lending.borrowerBankIfsc || "",
    borrowerBankName: lending.borrowerBankName || "",
    idProofType: lending.idProofType || "Aadhaar",
    idProofLast4: lending.idProofLast4 || "",
    loanPurpose: lending.loanPurpose || "",
    agreementCity: lending.agreementCity || "",
    penaltyRatePerMonth: lending.penaltyRatePerMonth ?? 2,
    arbitrationClause: lending.arbitrationClause !== false,
    lenderFullName: lending.lenderFullName || settings.displayName || "",
    lenderAddress: lending.lenderAddress || "",
    lenderPhone: lending.lenderPhone || settings.phoneNumber || "",
    witness1Name: lending.witness1Name || "",
    witness1Phone: lending.witness1Phone || "",
  });
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [panInput, setPanInput] = useState("");
  const [panVerifying, setPanVerifying] = useState(false);
  const [panVerifiedName, setPanVerifiedName] = useState("");
  const [panError, setPanError] = useState("");
  const [digiLockerOpen, setDigiLockerOpen] = useState(false);
  const [ifscHint, setIfscHint] = useState("");

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validateStep = (s) => {
    /** @type {Record<string, string>} */
    const e = {};
    if (s === 0) {
      if (!form.borrowerFullName.trim()) e.borrowerFullName = t("lending.legal.error.required");
      if (!form.borrowerAddress.trim()) e.borrowerAddress = t("lending.legal.error.required");
      if (!form.borrowerPhone.trim()) e.borrowerPhone = t("lending.legal.error.required");
    }
    if (s === 2) {
      if (!form.loanPurpose.trim()) e.loanPurpose = t("lending.legal.error.required");
      if (!form.agreementCity.trim()) e.agreementCity = t("lending.legal.error.required");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validateStep(2)) return;
    updateLending(lending.id, {
      ...form,
      penaltyRatePerMonth: Math.max(0, Number(form.penaltyRatePerMonth) || 2),
    });
    onComplete?.();
    onClose();
  };

  const next = () => {
    if (!validateStep(step)) return;
    if (step < 2) setStep(step + 1);
    else submit();
  };

  const handleVerifyPan = async () => {
    setPanVerifying(true);
    setPanError("");
    const result = await verifyPan(panInput);
    setPanVerifying(false);
    if (result.verified) {
      setPanVerifiedName(String(result.nameOnPan || result.name || ""));
      if (!form.borrowerFullName.trim() && result.name) set("borrowerFullName", result.name);
      set("idProofType", "PAN");
      set("idProofLast4", panInput.slice(-4));
      setPanInput("");
      return;
    }
    if (result.error === "kyc_not_configured") setPanError(t("kyc.pan.notConfigured"));
    else if (result.error === "invalid_pan_format") setPanError(t("kyc.pan.invalidFormat"));
    else setPanError(t("kyc.pan.failed"));
  };

  const handleIfscBlur = async () => {
    const code = form.borrowerBankIfsc;
    if (!code || code.replace(/\s/g, "").length !== 11) {
      setIfscHint("");
      return;
    }
    const data = await lookupIfsc(code);
    if (!data) {
      setIfscHint("");
      return;
    }
    if (!form.borrowerBankName) set("borrowerBankName", data.bank);
    setIfscHint(t("kyc.ifsc.found", { bank: data.bank, branch: data.branch, city: data.city }));
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose} title={t("lending.legal.modalTitle")}>
      <div className="ct-stack ct-legal-flow ct-nw-panel">
        <div className="ct-hero-card lending ct-stack-sm">
          <LegalStepper activeStep={step} panVerified={Boolean(panVerifiedName)} />
        </div>

        <div className="ct-stat-tile teal">
          <Caption className="block">{t("lending.legal.itActInfo")}</Caption>
        </div>

        {step === 0 ? (
          <>
            <Heading level={3}>{t("lending.legal.borrowerSection")}</Heading>
            <div>
              <label className="ct-field-label">{t("lending.legal.borrowerName")}</label>
              <input className={inputClass} value={form.borrowerFullName} onChange={(e) => set("borrowerFullName", e.target.value)} />
              <Caption className="block mt-1">{t("lending.legal.borrowerNameHint")}</Caption>
              {errors.borrowerFullName ? <Caption className="ct-text-danger block">{String(errors.borrowerFullName)}</Caption> : null}
            </div>
            <div>
              <label className="ct-field-label">{t("lending.legal.borrowerAddress")}</label>
              <textarea className={`${inputClass} min-h-[72px]`} rows={3} value={form.borrowerAddress} onChange={(e) => set("borrowerAddress", e.target.value)} />
              {errors.borrowerAddress ? <Caption className="ct-text-danger block">{errors.borrowerAddress}</Caption> : null}
            </div>
            <div>
              <label className="ct-field-label">{t("lending.legal.borrowerPhone")}</label>
              <input className={inputClass} value={form.borrowerPhone} onChange={(e) => set("borrowerPhone", e.target.value.replace(/\D/g, "").slice(0, 12))} />
              {errors.borrowerPhone ? <Caption className="ct-text-danger block">{errors.borrowerPhone}</Caption> : null}
            </div>
            <div className="ct-row gap-2">
              <div className="flex-1">
                <label className="ct-field-label">{t("lending.legal.idProofType")}</label>
                <select className={inputClass} value={form.idProofType} onChange={(e) => set("idProofType", e.target.value)}>
                  {ID_PROOF_TYPES.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="ct-field-label">{t("lending.legal.idLast4")}</label>
                <input className={inputClass} maxLength={4} value={form.idProofLast4} onChange={(e) => set("idProofLast4", e.target.value.replace(/\D/g, "").slice(0, 4))} />
              </div>
            </div>
            <div>
              <label className="ct-field-label">{t("kyc.pan.label")}</label>
              <div className="ct-row gap-2">
                <input className={`${inputClass} flex-1 ct-numeral`} maxLength={10} value={panInput} onChange={(e) => setPanInput(e.target.value.replace(/\s/g, "").toUpperCase().slice(0, 10))} placeholder="AAAAA9999A" />
                <Button type="button" variant="outline" size="sm" disabled={panVerifying || panInput.length !== 10} onClick={handleVerifyPan}>
                  {panVerifying ? t("common.loading") : t("kyc.pan.verify")}
                </Button>
              </div>
              {panVerifiedName ? <Caption className="ct-text-success block mt-1">{t("kyc.pan.verified", { name: panVerifiedName })}</Caption> : null}
              {panError ? <Caption className="ct-text-danger block mt-1">{panError}</Caption> : null}
              {!isKycConfigured() ? <Caption className="block mt-1 opacity-80">{t("kyc.pan.notConfigured")}</Caption> : null}
            </div>
            <div>
              <label className="ct-field-label">{t("kyc.ifsc.label")}</label>
              <input className={`${inputClass} ct-numeral`} maxLength={11} value={form.borrowerBankIfsc} onChange={(e) => set("borrowerBankIfsc", e.target.value.toUpperCase())} onBlur={handleIfscBlur} />
              {ifscHint ? <Caption className="block mt-1">{ifscHint}</Caption> : null}
            </div>
            <div>
              <label className="ct-field-label">{t("kyc.bankName.label")}</label>
              <input className={inputClass} value={form.borrowerBankName} onChange={(e) => set("borrowerBankName", e.target.value)} />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Heading level={3}>{t("lending.legal.step.esign")}</Heading>
            <button type="button" className="ct-digilocker-btn" onClick={() => setDigiLockerOpen(true)}>
              <CtIcon name="identification-card" size={20} />
              {t("kyc.digilocker.cta")}
            </button>
            {digiLockerOpen ? (
              <ToneSurface tone="info">
                <Body className="!text-sm">{t("kyc.digilocker.placeholder")}</Body>
                <a href="https://www.digilocker.gov.in" target="_blank" rel="noopener noreferrer" className="ct-link text-sm">
                  {t("kyc.digilocker.learnMore")}
                </a>
              </ToneSurface>
            ) : null}
            <Caption className="block">{t("lending.esign.explainer")}</Caption>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Heading level={3}>{t("lending.legal.termsSection")}</Heading>
            <div>
              <label className="ct-field-label">{t("lending.legal.loanPurpose")}</label>
              <input className={inputClass} placeholder={t("lending.legal.loanPurposePh")} value={form.loanPurpose} onChange={(e) => set("loanPurpose", e.target.value)} />
              {errors.loanPurpose ? <Caption className="ct-text-danger block">{errors.loanPurpose}</Caption> : null}
            </div>
            <div>
              <label className="ct-field-label">{t("lending.legal.agreementCity")}</label>
              <input className={inputClass} value={form.agreementCity} onChange={(e) => set("agreementCity", e.target.value)} />
              {errors.agreementCity ? <Caption className="ct-text-danger block">{errors.agreementCity}</Caption> : null}
            </div>
            <div>
              <label className="ct-field-label">{t("lending.legal.penaltyRate")}</label>
              <input type="number" min="0" className={inputClass} value={form.penaltyRatePerMonth} onChange={(e) => set("penaltyRatePerMonth", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.arbitrationClause} onChange={(e) => set("arbitrationClause", e.target.checked)} />
              <span className="text-sm">{t("lending.legal.arbitration")}</span>
            </label>
            <Heading level={3}>{t("lending.legal.lenderSection")}</Heading>
            <div>
              <label className="ct-field-label">{t("lending.legal.lenderName")}</label>
              <input className={inputClass} value={form.lenderFullName} onChange={(e) => set("lenderFullName", e.target.value)} />
            </div>
            <div>
              <label className="ct-field-label">{t("lending.legal.lenderPhone")}</label>
              <input className={inputClass} value={form.lenderPhone} onChange={(e) => set("lenderPhone", e.target.value.replace(/\D/g, "").slice(0, 12))} />
            </div>
            <Heading level={3}>{t("lending.legal.witnessSection")}</Heading>
            <Caption className="block">{t("lending.legal.witnessHint")}</Caption>
            <div>
              <label className="ct-field-label">{t("lending.legal.witnessName")}</label>
              <input className={inputClass} value={form.witness1Name} onChange={(e) => set("witness1Name", e.target.value)} />
            </div>
          </>
        ) : null}

        <div className="ct-row gap-2">
          {step > 0 ? (
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(step - 1)}>
              {t("lending.legal.prevStep")}
            </Button>
          ) : null}
          <Button type="button" variant="primary" size="lg" className="flex-1" onClick={next}>
            {step < 2 ? t("lending.legal.nextStep") : t("lending.legal.completeCta")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
