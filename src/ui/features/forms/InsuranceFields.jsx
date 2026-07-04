import { buildInsuranceBillName } from "../../../constants/insurance.js";
import { Body, Caption } from "../../primitives/Text.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * @param {{ values: { insurancePolicyId?: string, insuranceCompany?: string, insuredPersonName?: string }, onChange: Function, fieldClass: Function, errors?: Record<string, string> }} props
 */
export default function InsuranceFields({ values, onChange, fieldClass, errors = /** @type {Record<string, string>} */ ({}) }) {
  const { t } = useTranslation();
  const preview = buildInsuranceBillName(values);

  return (
    <div className="ed-inset-indigo ed-stack-sm">
      <Caption className="block leading-relaxed">{t("insurance.form.trackNote")}</Caption>
      <div>
        <label className="ed-field-label">
          {t("insurance.form.policyId")} <span style={{ color: "var(--ed-red)" }}>*</span>
        </label>
        <input
          type="text"
          className={fieldClass("insurancePolicyId")}
          value={values.insurancePolicyId || ""}
          onChange={(e) => onChange("insurancePolicyId", e.target.value)}
          placeholder={t("insurance.form.phPolicyId")}
        />
        {errors.insurancePolicyId && <p className="ed-field-error">{errors.insurancePolicyId}</p>}
      </div>
      <div>
        <label className="ed-field-label">{t("insurance.form.company")}</label>
        <input
          type="text"
          className={fieldClass("insuranceCompany")}
          value={values.insuranceCompany || ""}
          onChange={(e) => onChange("insuranceCompany", e.target.value)}
          placeholder={t("insurance.form.phCompany")}
        />
      </div>
      <div>
        <label className="ed-field-label">{t("insurance.form.insuredPerson")}</label>
        <input
          type="text"
          className={fieldClass("insuredPersonName")}
          value={values.insuredPersonName || ""}
          onChange={(e) => onChange("insuredPersonName", e.target.value)}
          placeholder={t("insurance.form.phHolder")}
        />
      </div>
      {preview && (
        <div className="ed-inset">
          {t("insurance.form.willShowAs")} <Body className="inline font-semibold">{preview}</Body>
        </div>
      )}
    </div>
  );
}
