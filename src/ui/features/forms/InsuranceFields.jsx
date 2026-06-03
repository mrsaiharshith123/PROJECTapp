import { buildInsuranceBillName } from "../../../constants/insurance.js";
import { Body, Caption } from "../../primitives/Text.jsx";

/**
 * @param {{ values: { insurancePolicyId?: string, insuranceCompany?: string, insuredPersonName?: string }, onChange: Function, inputClass: Function, errors?: Record<string, string> }} props
 */
export default function InsuranceFields({ values, onChange, inputClass, errors = /** @type {Record<string, string>} */ ({}) }) {
  const preview = buildInsuranceBillName(values);

  return (
    <div className="ct-form-panel ct-form-panel-info">
      <Caption className="block leading-relaxed">
        Track the policy here. Use <strong>Repeat</strong> below for how often you pay the premium.
      </Caption>
      <div>
        <label className="ct-field-label">
          Policy / ID number <span className="ct-text-danger">*</span>
        </label>
        <input
          type="text"
          className={inputClass("insurancePolicyId")}
          value={values.insurancePolicyId || ""}
          onChange={(e) => onChange("insurancePolicyId", e.target.value)}
          placeholder="e.g. LIC 123456789"
        />
        {errors.insurancePolicyId && <p className="ct-field-hint ct-text-danger">{errors.insurancePolicyId}</p>}
      </div>
      <div>
        <label className="ct-field-label">Insurance company</label>
        <input
          type="text"
          className={inputClass("insuranceCompany")}
          value={values.insuranceCompany || ""}
          onChange={(e) => onChange("insuranceCompany", e.target.value)}
          placeholder="e.g. LIC, HDFC Life"
        />
      </div>
      <div>
        <label className="ct-field-label">Insured person</label>
        <input
          type="text"
          className={inputClass("insuredPersonName")}
          value={values.insuredPersonName || ""}
          onChange={(e) => onChange("insuredPersonName", e.target.value)}
          placeholder="Policy holder name"
        />
      </div>
      {preview && (
        <div className="ct-preview-box">
          Will show as: <Body className="inline font-semibold">{preview}</Body>
        </div>
      )}
    </div>
  );
}
