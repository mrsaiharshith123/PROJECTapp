import { useState } from "react";
import { Modal, Button, Caption, Heading, inputClassName } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const ID_PROOF_TYPES = ["Aadhaar", "PAN", "Voter ID", "Passport", "Driving Licence"];
const inputClass = inputClassName();

/**
 * @param {{ lending: object, open: boolean, onClose: () => void, onComplete?: () => void }} props
 */
export default function LegalDetailsModal({ lending, open, onClose, onComplete }) {
  const { t } = useTranslation();
  const { settings, updateLending } = useCommitTrack();

  const [form, setForm] = useState({
    borrowerFullName: lending.borrowerFullName || "",
    borrowerAddress: lending.borrowerAddress || "",
    borrowerPhone: lending.borrowerPhone || "",
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

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    /** @type {Record<string, string>} */
    const e = {};
    if (!form.borrowerFullName.trim()) e.borrowerFullName = t("lending.legal.error.required");
    if (!form.borrowerAddress.trim()) e.borrowerAddress = t("lending.legal.error.required");
    if (!form.borrowerPhone.trim()) e.borrowerPhone = t("lending.legal.error.required");
    if (!form.loanPurpose.trim()) e.loanPurpose = t("lending.legal.error.required");
    if (!form.agreementCity.trim()) e.agreementCity = t("lending.legal.error.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    updateLending(lending.id, {
      ...form,
      penaltyRatePerMonth: Math.max(0, Number(form.penaltyRatePerMonth) || 2),
    });
    onComplete?.();
    onClose();
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose} title={t("lending.legal.modalTitle")}>
      <div className="ct-stack">
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
          <Caption className="block mt-1">{t("lending.legal.borrowerPhoneHint")}</Caption>
          {errors.borrowerPhone ? <Caption className="ct-text-danger block">{errors.borrowerPhone}</Caption> : null}
        </div>
        <div className="ct-row gap-2">
          <div className="flex-1">
            <label className="ct-field-label">{t("lending.legal.idProofType")}</label>
            <select className={inputClass} value={form.idProofType} onChange={(e) => set("idProofType", e.target.value)}>
              {ID_PROOF_TYPES.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="ct-field-label">{t("lending.legal.idLast4")}</label>
            <input className={inputClass} maxLength={4} value={form.idProofLast4} onChange={(e) => set("idProofLast4", e.target.value.replace(/\D/g, "").slice(0, 4))} />
          </div>
        </div>

        <Heading level={3}>{t("lending.legal.termsSection")}</Heading>
        <div>
          <label className="ct-field-label">{t("lending.legal.loanPurpose")}</label>
          <input className={inputClass} placeholder={t("lending.legal.loanPurposePh")} value={form.loanPurpose} onChange={(e) => set("loanPurpose", e.target.value)} />
          {errors.loanPurpose ? <Caption className="ct-text-danger block">{errors.loanPurpose}</Caption> : null}
        </div>
        <div>
          <label className="ct-field-label">{t("lending.legal.agreementCity")}</label>
          <input className={inputClass} value={form.agreementCity} onChange={(e) => set("agreementCity", e.target.value)} />
          <Caption className="block mt-1">{t("lending.legal.agreementCityHint")}</Caption>
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
        <Caption className="block">{t("lending.legal.arbitrationHint")}</Caption>

        <Heading level={3}>{t("lending.legal.lenderSection")}</Heading>
        <input className={inputClass} value={form.lenderFullName} onChange={(e) => set("lenderFullName", e.target.value)} placeholder={t("lending.legal.lenderName")} />
        <textarea className={`${inputClass} min-h-[56px]`} value={form.lenderAddress} onChange={(e) => set("lenderAddress", e.target.value)} placeholder={t("lending.legal.lenderAddress")} />
        <input className={inputClass} value={form.lenderPhone} onChange={(e) => set("lenderPhone", e.target.value)} placeholder={t("lending.legal.lenderPhone")} />

        <Heading level={3}>{t("lending.legal.witnessSection")}</Heading>
        <Caption className="block">{t("lending.legal.witnessHint")}</Caption>
        <input className={inputClass} value={form.witness1Name} onChange={(e) => set("witness1Name", e.target.value)} placeholder={t("lending.legal.witnessName")} />
        <input className={inputClass} value={form.witness1Phone} onChange={(e) => set("witness1Phone", e.target.value)} placeholder={t("lending.legal.witnessPhone")} />

        <Button type="button" variant="primary" onClick={submit}>
          {t("lending.legal.completeCta")}
        </Button>
      </div>
    </Modal>
  );
}
