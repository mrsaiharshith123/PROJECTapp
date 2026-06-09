import { useState } from "react";
import { Modal, fieldInputClass } from "../../../ui";
import {
  categoryShowsInterestRate,
  categoryShowsInsuranceFields,
  categoryShowsChitFundFields,
} from "../../../constants/categories.js";
import ChitFundFields from "../forms/ChitFundFields.jsx";
import {
  buildChitPayloadFromForm,
  chitFieldsFromCommitment,
  chitFundHasRequiredFields,
  applyChitFormSync,
  categoryIsChitFund,
} from "../../../constants/chitFund.js";
import { getCategoriesForUserMode, isSalariedFamily } from "../../../constants/modeExperience.js";
import InsuranceFields from "../forms/InsuranceFields.jsx";
import { buildInsuranceBillName, insuranceBillHasIdentity } from "../../../constants/insurance.js";
import { inferPriorityFromCategory, OTHER_PRIORITY_OPTIONS } from "../../../constants/priority.js";
import { repeatTypeToPremiumFrequency } from "../../../constants/insurance.js";
import { REPEAT_OPTIONS } from "../../../constants/repeatTypes.js";
import { useCopy } from "../../../i18n/useCopy.js";
import {
  applyBillRepeatChange,
  applyBillStartDateChange,
  defaultDueDateFromStart,
  defaultEndDateFromStart,
} from "../../../utils/billDates.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

function formFromCommitment(c, todayStr) {
  const startDate = c.startDate || c.dueDate || "";
  const repeatType = c.repeatType || "none";
  return {
    name: c.name || "",
    amount: String(c.amount ?? ""),
    startDate,
    endDate: c.endDate || "",
    dueDate: c.dueDate || defaultDueDateFromStart(startDate, repeatType, todayStr),
    category: c.category || "Other",
    repeatType,
    priority: c.priority || "medium",
    notes: c.notes || "",
    annualInterestRate: c.annualInterestRate != null ? String(c.annualInterestRate) : "",
    trialEnd: c.trialEnd || "",
    householdPayer: c.householdPayer || "",
    insurancePolicyId: c.insurancePolicyId || "",
    insuredPersonName: c.insuredPersonName || "",
    insuranceCompany: c.insuranceCompany || "",
    ...chitFieldsFromCommitment(c),
  };
}

export default function CommitmentEditModal({ commitment, onClose, onSave }) {
  const { t } = useTranslation();
  const copy = useCopy();
  const { todayStr, settings } = useCommitTrack();
  const salariedFamily = isSalariedFamily(settings);
  const billCategories = getCategoriesForUserMode(settings);
  const [form, setForm] = useState(() => formFromCommitment(commitment, todayStr));
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));

  const patchForm = (patch) => {
    setForm((f) => {
      let next;
      if (patch.startDate !== undefined) {
        next = applyBillStartDateChange(f, patch.startDate, todayStr);
      } else if (patch.repeatType !== undefined) {
        next = applyBillRepeatChange(f, patch.repeatType, todayStr);
      } else {
        next = { ...f, ...patch };
      }
      if (patch.category !== undefined && categoryIsChitFund(patch.category)) {
        next = { ...next, repeatType: "monthly" };
      }
      return categoryIsChitFund(next.category) ? applyChitFormSync(next) : next;
    });
  };

  const fillEndDateIfEmpty = () => {
    if (!form.startDate || form.endDate) return;
    patchForm({ endDate: defaultEndDateFromStart(form.startDate, todayStr) });
  };
  const showInterest = categoryShowsInterestRate(form.category);
  const showInsurance = categoryShowsInsuranceFields(form.category);
  const showChit = categoryShowsChitFundFields(form.category);
  const isSubscription = form.category === "Subscription";
  const isOther = form.category === "Other";

  const fieldClass = (field) => fieldInputClass(Boolean(errors[field]));

  const validate = () => {
    const errs = {};
    if (showInsurance) {
      if (!insuranceBillHasIdentity(form)) errs.insurancePolicyId = "Enter policy ID, company, or insured person";
    } else if (!form.name.trim()) {
      errs.name = "Name is required";
    }
    if (showChit) {
      if (!chitFundHasRequiredFields(form)) {
        if (!form.chitValue || Number(form.chitValue) <= 0) errs.chitValue = "Enter chit value";
        if (!form.chitMonths || Number(form.chitMonths) < 1) errs.chitMonths = "Enter months";
      }
    } else if (!form.amount || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = "Enter a valid amount";
    }
    if (!form.startDate) errs.startDate = "Start date is required";
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      errs.endDate = "End date must be on or after start date";
    }
    if (!form.dueDate) errs.dueDate = "Next payment due is required";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(/** @type {Record<string, string>} */ (/** @type {unknown} */ (errs)));
      return;
    }
    const billName = showInsurance
      ? buildInsuranceBillName(form) || form.name.trim() || commitment.name
      : form.name.trim();

    const chitPayload = showChit ? buildChitPayloadFromForm(form) : {};
    const billAmount = showChit ? chitPayload.amount : Number(form.amount);

    onSave(commitment.id, {
      name: billName,
      amount: billAmount,
      startDate: form.startDate,
      endDate: chitPayload.endDate || form.endDate || "",
      dueDate: form.dueDate,
      category: form.category,
      repeatType: showChit ? "monthly" : form.repeatType,
      priority: isOther ? form.priority : inferPriorityFromCategory(form.category),
      notes: form.notes.trim(),
      annualInterestRate:
        showInterest && form.annualInterestRate !== ""
          ? Math.min(60, Math.max(0, Number(form.annualInterestRate) || 0))
          : null,
      trialEnd: isSubscription ? form.trialEnd || "" : "",
      ...(showInsurance
        ? {
            insurancePolicyId: form.insurancePolicyId.trim(),
            insuredPersonName: form.insuredPersonName.trim(),
            insuranceCompany: form.insuranceCompany.trim(),
            insurancePremiumFrequency: repeatTypeToPremiumFrequency(form.repeatType),
            insuranceSumAssured: null,
            insuranceTermYears: null,
            insuranceMaturityBenefit: null,
          }
        : {
            insurancePolicyId: "",
            insuredPersonName: "",
            insuranceCompany: "",
            insurancePremiumFrequency: "",
            insuranceSumAssured: null,
            insuranceTermYears: null,
            insuranceMaturityBenefit: null,
          }),
      ...(showChit ? chitPayload : {}),
      householdPayer: salariedFamily ? form.householdPayer || "" : "",
    });
    onClose();
  };

  return (
    <Modal
      title={copy.editBill}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Name</label>
          <input
            className={fieldClass("name")}
            value={form.name}
            onChange={(e) => patchForm({ name: e.target.value })}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
            {showChit ? "This month's installment (₹)" : "Amount (₹)"}
          </label>
          <input
            type="number"
            min="0"
            readOnly={showChit && form.chitInstallmentMode !== "custom"}
            className={`${fieldClass("amount")} ${showChit && form.chitInstallmentMode !== "custom" ? "bg-gray-100 dark:bg-slate-700/80 cursor-default" : ""}`}
            value={form.amount}
            onChange={(e) => patchForm({ amount: e.target.value })}
          />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          {showChit && form.chitInstallmentMode !== "custom" && (
            <p className="text-[11px] text-yellow-800 dark:text-yellow-200 mt-1">
              From chit value and month. Choose &quot;fixed amount&quot; in chit details to edit manually.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Start date</label>
            <input
              type="date"
              className={fieldClass("startDate")}
              value={form.startDate}
              onChange={(e) => patchForm({ startDate: e.target.value })}
            />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              End date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              className={fieldClass("endDate")}
              value={form.endDate}
              onChange={(e) => patchForm({ endDate: e.target.value })}
              onFocus={fillEndDateIfEmpty}
            />
            {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Next payment due</label>
          <input
            type="date"
            className={fieldClass("dueDate")}
            value={form.dueDate}
            onChange={(e) => patchForm({ dueDate: e.target.value })}
          />
          {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Category</label>
          <select
            className={fieldClass("category")}
            value={form.category}
            onChange={(e) => {
              const cat = e.target.value;
              patchForm({
                category: cat,
                priority: cat === "Other" ? form.priority : inferPriorityFromCategory(cat),
              });
            }}
          >
            {billCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {!showChit && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Repeat</label>
            <select
              className={fieldClass("repeat")}
              value={form.repeatType}
              onChange={(e) => patchForm({ repeatType: e.target.value })}
            >
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {isOther && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Priority</label>
            <select
              className={fieldClass("priority")}
              value={form.priority}
              onChange={(e) => patchForm({ priority: e.target.value })}
            >
              {OTHER_PRIORITY_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showChit && (
          <ChitFundFields
            values={form}
            errors={errors}
            fieldClass={fieldClass}
            todayStr={todayStr}
            onChange={(name, value) => patchForm({ [name]: value })}
          />
        )}

        {showInsurance && (
          <InsuranceFields
            values={form}
            errors={errors}
            fieldClass={fieldClass}
            onChange={(name, value) => patchForm({ [name]: value })}
          />
        )}

        {showInterest && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Annual interest % <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              max="60"
              step="0.1"
              className={fieldClass("annualInterestRate")}
              value={form.annualInterestRate}
              onChange={(e) => patchForm({ annualInterestRate: e.target.value })}
              placeholder={t("form.phPayoffRanking")}
            />
          </div>
        )}
        {isSubscription && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Trial ends <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              className={fieldClass("trialEnd")}
              value={form.trialEnd}
              onChange={(e) => patchForm({ trialEnd: e.target.value })}
            />
          </div>
        )}
        {salariedFamily && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
              Who pays this bill? <span className="text-gray-400 font-normal">(optional)</span>
              <InfoTip text={CALC_HELP.householdPayerBillTag} />
            </label>
            <select
              className={fieldClass("householdPayer")}
              value={form.householdPayer || ""}
              onChange={(e) => patchForm({ householdPayer: e.target.value })}
            >
              <option value="">Not tagged — counts in household total only</option>
              <option value="primary">Primary income / main earner</option>
              <option value="secondary">Second income / partner</option>
              <option value="shared">Shared / joint</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Notes</label>
          <textarea
            className={`${fieldClass("notes")} min-h-[80px] resize-y`}
            value={form.notes}
            onChange={(e) => patchForm({ notes: e.target.value })}
            placeholder={t("form.phOptional")}
          />
        </div>
      </div>
    </Modal>
  );
}
