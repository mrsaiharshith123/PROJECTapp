import { useEffect, useRef, useState } from "react";
import { Modal, fieldInputClass, Button, Caption } from "../../../ui";
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
import { getCategoriesForUserMode } from "../../../constants/modeExperience.js";
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
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { searchFund } from "../../../services/market/amfiNav.js";

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
    insurancePolicyId: c.insurancePolicyId || "",
    insuredPersonName: c.insuredPersonName || "",
    insuranceCompany: c.insuranceCompany || "",
    schemeCode: c.schemeCode || "",
    schemeName: c.schemeName || "",
    ...chitFieldsFromCommitment(c),
  };
}

export default function CommitmentEditModal({ commitment, onClose, onSave }) {
  const { t } = useTranslation();
  const copy = useCopy();
  const { todayStr, settings } = usePerovo();
  const billCategories = getCategoriesForUserMode(settings);
  const [form, setForm] = useState(() => formFromCommitment(commitment, todayStr));
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));
  const [fundQuery, setFundQuery] = useState(() => formFromCommitment(commitment, todayStr).schemeName || "");
  const [fundHits, setFundHits] = useState([]);
  const fundDebounce = useRef(null);
  const visibleFundHits =
    form.category === "SIP" && fundQuery.length >= 3 ? fundHits : [];

  useEffect(() => {
    if (form.category !== "SIP" || fundQuery.length < 3) {
      return undefined;
    }
    clearTimeout(fundDebounce.current);
    fundDebounce.current = setTimeout(() => {
      searchFund(fundQuery).then(setFundHits);
    }, 300);
    return () => clearTimeout(fundDebounce.current);
  }, [fundQuery, form.category]);

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

  const fieldClass = (field) => `${fieldInputClass(Boolean(errors[field]))} ct-input-tint`;

  const validate = () => {
    const errs = {};
    if (showInsurance) {
      if (!insuranceBillHasIdentity(form)) errs.insurancePolicyId = t("commitment.edit.error.insuranceIdentity");
    } else if (!form.name.trim()) {
      errs.name = t("commitment.edit.error.nameRequired");
    }
    if (showChit) {
      if (!chitFundHasRequiredFields(form)) {
        if (!form.chitValue || Number(form.chitValue) <= 0) errs.chitValue = t("commitment.edit.error.chitValue");
        if (!form.chitMonths || Number(form.chitMonths) < 1) errs.chitMonths = t("commitment.edit.error.chitMonths");
      }
    } else if (!form.amount || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = t("commitment.edit.error.amountRequired");
    }
    if (!form.startDate) errs.startDate = t("commitment.edit.error.startDateRequired");
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      errs.endDate = t("commitment.edit.error.endDateOrder");
    }
    if (!form.dueDate) errs.dueDate = t("commitment.edit.error.dueDateRequired");
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
      schemeCode: form.category === "SIP" ? String(form.schemeCode || "") : "",
      schemeName: form.category === "SIP" ? String(form.schemeName || "") : "",
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
    });
    onClose();
  };

  return (
    <Modal
      title={copy.editBill}
      onClose={onClose}
      footer={
        <div className="ct-row gap-2 w-full">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="primary" className="flex-1" onClick={handleSave}>
            {t("common.save")}
          </Button>
        </div>
      }
    >
      <div className="ct-stack ct-nw-panel">
        {form.category ? (
          <div className="ct-stat-tile indigo">
            <p className="ct-stat-tile-label">{t("add.categoryLabel")}</p>
            <p className="ct-stat-tile-value text-sm">{form.category}</p>
          </div>
        ) : null}
        <div>
          <label className="ct-field-label">{t("commitment.edit.name")}</label>
          <input
            className={fieldClass("name")}
            value={form.name}
            onChange={(e) => patchForm({ name: e.target.value })}
          />
          {errors.name && <p className="ct-field-hint ct-text-danger">{errors.name}</p>}
        </div>
        <div>
          <label className="ct-field-label">
            {showChit ? t("commitment.edit.installment") : t("commitment.edit.amount")}
          </label>
          <input
            type="number"
            min="0"
            readOnly={showChit && form.chitInstallmentMode !== "custom"}
            className={`${fieldClass("amount")} ${showChit && form.chitInstallmentMode !== "custom" ? "opacity-80 cursor-default" : ""}`}
            value={form.amount}
            onChange={(e) => patchForm({ amount: e.target.value })}
          />
          {errors.amount && <p className="ct-field-hint ct-text-danger">{errors.amount}</p>}
          {showChit && form.chitInstallmentMode !== "custom" && (
            <p className="ct-field-hint ct-text-warning mt-1">
              {t("commitment.edit.chitInstallmentHint")}
            </p>
          )}
        </div>
        <div className="ct-grid-2">
          <div>
            <label className="ct-field-label">{t("commitment.edit.startDate")}</label>
            <input
              type="date"
              className={fieldClass("startDate")}
              value={form.startDate}
              onChange={(e) => patchForm({ startDate: e.target.value })}
            />
            {errors.startDate && <p className="ct-field-hint ct-text-danger">{errors.startDate}</p>}
          </div>
          <div>
            <label className="ct-field-label">
              {t("commitment.edit.endDate")} <span className="ct-text-muted font-normal">{t("commitment.edit.endDateOptional")}</span>
            </label>
            <input
              type="date"
              className={fieldClass("endDate")}
              value={form.endDate}
              onChange={(e) => patchForm({ endDate: e.target.value })}
              onFocus={fillEndDateIfEmpty}
            />
            {errors.endDate && <p className="ct-field-hint ct-text-danger">{errors.endDate}</p>}
          </div>
        </div>
        <div>
          <label className="ct-field-label">{t("commitment.edit.nextDue")}</label>
          <input
            type="date"
            className={fieldClass("dueDate")}
            value={form.dueDate}
            onChange={(e) => patchForm({ dueDate: e.target.value })}
          />
          {errors.dueDate && <p className="ct-field-hint ct-text-danger">{errors.dueDate}</p>}
        </div>
        <div>
          <label className="ct-field-label">{t("commitment.edit.category")}</label>
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
        {form.category === "SIP" ? (
          <div>
            <label className="ct-field-label">
              {t("commitment.sip.fundSearch")}
            </label>
            <input
              className={fieldClass("scheme")}
              value={fundQuery}
              onChange={(e) => setFundQuery(e.target.value)}
            />
            {visibleFundHits.length > 0 ? (
              <ul className="ct-stack-sm mt-1 max-h-32 overflow-y-auto">
                {visibleFundHits.map((hit) => (
                  <li key={hit.schemeCode}>
                    <button
                      type="button"
                      className="ct-link text-left text-sm"
                      onClick={() => {
                        patchForm({ schemeCode: hit.schemeCode, schemeName: hit.schemeName });
                        setFundQuery(hit.schemeName);
                        setFundHits([]);
                      }}
                    >
                      {hit.schemeName}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <Caption className="block mt-1">
              {form.schemeCode ? t("commitment.sip.fundNavHint") : t("commitment.sip.fundEmpty")}
            </Caption>
          </div>
        ) : null}
        {!showChit && (
          <div>
            <label className="ct-field-label">{t("commitment.edit.repeat")}</label>
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
            <label className="ct-field-label">{t("commitment.edit.priority")}</label>
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
            <label className="ct-field-label">
              {t("commitment.edit.interestOptional")} <span className="ct-text-muted font-normal">{t("commitment.edit.endDateOptional")}</span>
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
            <label className="ct-field-label">
              {t("commitment.edit.trialEnds")} <span className="ct-text-muted font-normal">{t("commitment.edit.endDateOptional")}</span>
            </label>
            <input
              type="date"
              className={fieldClass("trialEnd")}
              value={form.trialEnd}
              onChange={(e) => patchForm({ trialEnd: e.target.value })}
            />
          </div>
        )}
        <div>
          <label className="ct-field-label">{t("commitment.edit.notes")}</label>
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
