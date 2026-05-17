import { buildInsuranceBillName } from "../constants/insurance.js";

/** Minimal insurance fields on Add / Edit bill forms (payment timing = Repeat below). */
export default function InsuranceFields({ values, onChange, inputClass, errors = {} }) {
  const preview = buildInsuranceBillName(values);

  return (
    <div className="space-y-4 rounded-xl border border-teal-200 dark:border-teal-800 p-4 bg-teal-50/50 dark:bg-slate-800/80">
      <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed">
        Track the policy here. Use <strong>Repeat</strong> below for how often you pay the premium.
      </p>
      <div>
        <label className="block text-sm font-semibold text-gray-800 dark:text-slate-100 mb-1.5">
          Policy / ID number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className={inputClass("insurancePolicyId")}
          value={values.insurancePolicyId || ""}
          onChange={(e) => onChange("insurancePolicyId", e.target.value)}
          placeholder="e.g. LIC 123456789"
        />
        {errors.insurancePolicyId && <p className="text-xs text-red-500 mt-1">{errors.insurancePolicyId}</p>}
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-800 dark:text-slate-100 mb-1.5">
          Insurance company
        </label>
        <input
          type="text"
          className={inputClass("insuranceCompany")}
          value={values.insuranceCompany || ""}
          onChange={(e) => onChange("insuranceCompany", e.target.value)}
          placeholder="e.g. LIC, HDFC Life"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-800 dark:text-slate-100 mb-1.5">Insured person</label>
        <input
          type="text"
          className={inputClass("insuredPersonName")}
          value={values.insuredPersonName || ""}
          onChange={(e) => onChange("insuredPersonName", e.target.value)}
          placeholder="Policy holder name"
        />
      </div>
      {preview && (
        <p className="text-xs text-indigo-900 dark:text-indigo-100 bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-700 rounded-lg px-3 py-2">
          Will show as: <span className="font-semibold">{preview}</span>
        </p>
      )}
    </div>
  );
}
