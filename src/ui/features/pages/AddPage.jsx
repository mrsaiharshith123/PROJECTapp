import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, InfoTip, Button, fieldInputClass, PageHeader } from "../../";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import {
  categoryShowsInterestRate,
  categoryShowsInsuranceFields,
  categoryShowsChitFundFields,
} from "../../../constants/categories.js";
import ChitFundFields from "../forms/ChitFundFields.jsx";
import {
  emptyChitFundFields,
  buildChitPayloadFromForm,
  chitFundHasRequiredFields,
  chitEndDateFromStart,
  applyChitFormSync,
  categoryIsChitFund,
} from "../../../constants/chitFund.js";
import { getCategoriesForUserMode, isSalariedFamily } from "../../../constants/modeExperience.js";
import InsuranceFields from "../forms/InsuranceFields.jsx";
import {
  emptyInsuranceFields,
  buildInsuranceBillName,
  insuranceBillHasIdentity,
  repeatTypeToPremiumFrequency,
} from "../../../constants/insurance.js";
import { inferPriorityFromCategory, OTHER_PRIORITY_OPTIONS } from "../../../constants/priority.js";
import { COPY } from "../../../constants/copy.js";
import { PROFILE_SETTINGS_HINT } from "../../../constants/plainLanguage.js";
import { evaluateNewCommitmentAffordability, affordabilityBadgeClass } from "../../../engines/affordability.js";
import { getUserModeConfig } from "../../../constants/userModes.js";
import { estimatePriorSpend } from "../../../utils/billLifecycle.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import {
  applyBillRepeatChange,
  applyBillStartDateChange,
  defaultEndDateFromStart,
} from "../../../utils/billDates.js";
import { Caption } from "../../primitives/Text.jsx";
import { REPEAT_OPTIONS } from "../../../constants/repeatTypes.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";

const Add = () => {
  const { addCommitment, commitments, settings, todayStr, getEffectiveStatus } = useCommitTrack();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    amount: "",
    startDate: "",
    endDate: "",
    dueDate: "",
    category: "",
    repeatType: "none",
    priority: "medium",
    notes: "",
    householdPayer: "",
    annualInterestRate: "",
    ...emptyInsuranceFields(),
    ...emptyChitFundFields(),
  });
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      let next = { ...f, [name]: value };
      if (name === "startDate") {
        next = applyBillStartDateChange(f, value, todayStr);
      } else if (name === "repeatType") {
        next = applyBillRepeatChange(f, value, todayStr);
      } else if (name === "category") {
        next.priority = inferPriorityFromCategory(value || "Other");
        if (value === "Chit Fund") {
          next.repeatType = "monthly";
          if (next.startDate && next.chitMonths) {
            next.endDate = chitEndDateFromStart(next.startDate, next.chitMonths);
          }
        }
      }
      return categoryIsChitFund(next.category) ? applyChitFormSync(next) : next;
    });
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const fillEndDateIfEmpty = () => {
    if (!form.startDate || form.endDate) return;
    setForm((f) => ({ ...f, endDate: defaultEndDateFromStart(f.startDate, todayStr) }));
  };

  const validate = () => {
    const errs = {};
    const cat = form.category || "Other";
    const isIns = categoryShowsInsuranceFields(cat);

    if (!form.category) errs.category = "Choose a category";
    if (!isIns && !form.name.trim()) errs.name = "Name is required";
    if (isIns && !insuranceBillHasIdentity(form)) {
      errs.insurancePolicyId = "Enter policy ID, company, or insured person";
    }
    if (categoryShowsChitFundFields(cat)) {
      if (!chitFundHasRequiredFields(form)) {
        if (!form.chitValue || Number(form.chitValue) <= 0) errs.chitValue = "Enter chit value";
        if (!form.chitMonths || Number(form.chitMonths) < 1) errs.chitMonths = "Enter number of months";
        const m = Number(form.chitCurrentMonth);
        const N = Number(form.chitMonths);
        if (m < 1 || m > N) errs.chitCurrentMonth = `Month must be 1–${N || "?"}`;
      }
    } else if (!form.amount || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      errs.amount = "Enter a valid amount";
    }
    if (!form.startDate) errs.startDate = "Start date is required";
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      errs.endDate = "End date must be on or after start date";
    }
    const due = form.dueDate || form.startDate;
    if (!due) errs.dueDate = "Next payment due is required";
    return errs;
  };

  const modeCfg = getUserModeConfig(settings.userMode || "salaried");
  const billCategories = getCategoriesForUserMode(settings);
  const salariedFamily = isSalariedFamily(settings);
  const showAffordability = modeCfg.showAffordabilityOnAdd;
  const category = form.category || "Other";
  const showInterest = categoryShowsInterestRate(category);
  const showInsurance = categoryShowsInsuranceFields(category);
  const showChit = categoryShowsChitFundFields(category);
  const isSubscription = category === "Subscription";
  const isOther = category === "Other";

  const priorSpendHint = useMemo(() => {
    if (!form.startDate) return 0;
    return estimatePriorSpend(
      {
        startDate: form.startDate,
        dueDate: form.dueDate || form.startDate,
        endDate: form.endDate,
        repeatType: form.repeatType,
        amount: Number(form.amount) || 0,
        category,
      },
      todayStr
    );
  }, [form.startDate, form.dueDate, form.endDate, form.repeatType, form.amount, category, todayStr]);

  const affordability = useMemo(() => {
    if (!showAffordability) return null;
    const amt = Number(form.amount) || 0;
    if (amt <= 0) return null;
    const income = combinedMonthlyIncome(settings);
    if (income <= 0) return null;
    const due = form.dueDate || form.startDate || todayStr;
    const draft = {
      amount: amt,
      remainingAmount: amt,
      repeatType: form.repeatType,
      category,
      dueDate: due,
      startDate: form.startDate || due,
      endDate: form.endDate || "",
      status: "pending",
    };
    return evaluateNewCommitmentAffordability(income, commitments, draft, getEffectiveStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- income fields listed; full settings would over-rerender
  }, [
    showAffordability,
    form.amount,
    form.repeatType,
    category,
    form.dueDate,
    form.startDate,
    form.endDate,
    commitments,
    settings.monthlyIncome,
    settings.secondaryMonthlyIncome,
    todayStr,
    getEffectiveStatus,
  ]);

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(/** @type {Record<string, string>} */ (/** @type {unknown} */ (errs)));
      return;
    }

    const dueDate = form.dueDate || form.startDate;
    const billName = showInsurance
      ? buildInsuranceBillName(form) || form.name.trim() || "Insurance policy"
      : form.name.trim();

    const chitPayload = showChit ? buildChitPayloadFromForm(form) : {};
    const billAmount = showChit ? chitPayload.amount : Number(form.amount);

    const draft = {
      id: Date.now(),
      name: billName,
      amount: billAmount,
      startDate: form.startDate,
      endDate: chitPayload.endDate || form.endDate || "",
      dueDate,
      category,
      repeatType: showChit ? "monthly" : form.repeatType,
      priority: isOther ? form.priority : inferPriorityFromCategory(category),
      notes: form.notes.trim(),
      annualInterestRate:
        showInterest && form.annualInterestRate !== ""
          ? Math.min(60, Math.max(0, Number(form.annualInterestRate) || 0))
          : null,
      priorSpend: priorSpendHint,
      payments: [],
      status: "pending",
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
        : {}),
      ...(showChit ? chitPayload : {}),
      householdPayer: salariedFamily ? (form.householdPayer || "").trim() : "",
    };
    const effective = getEffectiveStatus({
      ...draft,
      remainingAmount: Number(form.amount),
    });

    addCommitment({
      ...draft,
      status: effective === "overdue" ? "overdue" : "pending",
    });
    navigate("/commitments");
  };

  const inputClass = (field) => fieldInputClass(Boolean(errors[field]));

  return (
    <div className="ct-page ct-form-narrow">
      <PageHeader title={COPY.addBill} eyebrow="New entry" />

      <Card className="ct-stack-lg">
        <div>
          <label className="ct-field-label">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass("category")}>
            <option value="">Select category</option>
            {billCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
        </div>

        {showChit && (
          <ChitFundFields
            values={form}
            errors={errors}
            inputClass={inputClass}
            todayStr={todayStr}
            onChange={(name, value) => {
              setForm((f) => applyChitFormSync({ ...f, [name]: value }));
              setErrors((er) => ({ ...er, [name]: "" }));
            }}
          />
        )}

        {showInsurance && (
          <InsuranceFields
            values={form}
            errors={errors}
            inputClass={inputClass}
            onChange={(name, value) => {
              setForm((f) => ({ ...f, [name]: value }));
              setErrors((er) => ({ ...er, [name]: "" }));
            }}
          />
        )}

        <div>
          <label className="ct-field-label">
            {showChit ? "This month's installment (₹)" : "Amount to pay (₹)"}
          </label>
          <div className="ct-input-prefix-wrap">
            <span className="ct-input-prefix">₹</span>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0"
              min="0"
              readOnly={showChit && form.chitInstallmentMode !== "custom"}
              className={`${inputClass("amount")} ct-input-with-prefix ${showChit && form.chitInstallmentMode !== "custom" ? "opacity-80 cursor-default" : ""}`}
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          {showChit && form.chitInstallmentMode !== "custom" && (
            <p className="text-[11px] text-yellow-800 dark:text-yellow-200 mt-1">
              From chit value and month. Use &quot;fixed amount&quot; in chit details if your group uses a different number.
            </p>
          )}
        </div>

        <div className="ct-grid-2">
          <div>
            <label className="ct-field-label">
              Start date <span className="text-gray-400 font-normal">(when it began)</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              className={inputClass("startDate")}
            />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label className="ct-field-label">
              End date{" "}
              <span className="text-gray-400 font-normal">
                {isSubscription ? "(optional — cancel reminder)" : "(optional)"}
              </span>
            </label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              onFocus={fillEndDateIfEmpty}
              className={inputClass("endDate")}
            />
            {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
          </div>
        </div>

        <div>
          <label className="ct-field-label">Next payment due</label>
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            className={inputClass("dueDate")}
          />
          {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
          <p className="text-[11px] text-gray-400 mt-1">
            Next payment date (not the same as start). We suggest the next due from your start day and repeat.
          </p>
        </div>

        {priorSpendHint > 0 && (
          <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg px-3 py-2">
            Est. ~₹{priorSpendHint.toLocaleString()} paid in years before {todayStr.slice(0, 4)} — included in spend
            totals. Record payments this year as you go.
          </p>
        )}

        {!showChit && (
          <div>
            <label className="ct-field-label">Repeat</label>
            <select name="repeatType" value={form.repeatType} onChange={handleChange} className={inputClass("repeatType")}>
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {showChit && (
          <p className="text-xs text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-3 py-2">
            Repeats monthly until the chit ends. When a new month starts, your due amount updates to the lower
            installment — you do not change it yourself.
          </p>
        )}

        {isOther && (
          <div>
            <label className="ct-field-label">Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className={inputClass("priority")}>
              {OTHER_PRIORITY_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">Other bills — you choose how urgent they are.</p>
          </div>
        )}

        {!isOther && form.category && (
          <p className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/80 rounded-lg px-3 py-2">
            Priority set automatically for {category} bills.
          </p>
        )}

        <div>
          <label className="ct-field-label">
            {COPY.billName}{" "}
            {showInsurance ? (
              <span className="text-gray-400 font-normal">(optional — auto from policy)</span>
            ) : null}
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={showInsurance ? "Nickname only if you want" : "e.g. Rent, EMI, school fees"}
            className={inputClass("name")}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {showInterest && (
          <div>
            <label className="ct-field-label">
              Annual interest % <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              name="annualInterestRate"
              value={form.annualInterestRate}
              onChange={handleChange}
              min="0"
              max="60"
              step="0.1"
              placeholder="e.g. 12 for EMI, 36 for card"
              className={inputClass("annualInterestRate")}
            />
          </div>
        )}

        {salariedFamily && (
          <div>
            <label className="ct-field-label">
              Who pays this bill? <span className="text-gray-400 font-normal">(optional)</span>
              <InfoTip text={CALC_HELP.householdPayerBillTag} />
            </label>
            <select
              name="householdPayer"
              value={form.householdPayer || ""}
              onChange={handleChange}
              className={inputClass("householdPayer")}
            >
              <option value="">Not tagged</option>
              <option value="primary">Primary / main earner</option>
              <option value="secondary">Second income / partner</option>
              <option value="shared">Shared / joint</option>
            </select>
          </div>
        )}

        <div>
          <label className="ct-field-label">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Account number, lender, reminders…"
            className={`${inputClass("notes")} min-h-[72px] resize-y`}
          />
        </div>

        <Button type="button" onClick={handleSubmit} size="lg">
          {COPY.addBill}
        </Button>
      </Card>

      {affordability && (
        <Card className="ct-stack-sm ct-insight-accent">
          <div className="ct-row" style={{ flexWrap: "wrap" }}>
            <Caption className="font-semibold uppercase">Affordability</Caption>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${affordabilityBadgeClass(affordability.tier)}`}
            >
              {affordability.label}
            </span>
          </div>
          <Caption>
            After adding: ~₹{Math.round(affordability.newTotalBurden).toLocaleString()}/mo burden vs income (
            {affordability.committedPercent != null ? `${affordability.committedPercent}%` : "—"} committed). Free
            money ≈ ₹{Math.round(affordability.freeMoneyAfter).toLocaleString()}.
          </Caption>
          <Caption>{PROFILE_SETTINGS_HINT}</Caption>
        </Card>
      )}

      <Card className="ct-insight-accent ct-stack-sm">
        <p className="ct-body-strong">Quick tips</p>
        <ul className="ct-stack-sm" style={{ fontSize: "0.75rem", color: "var(--ct-accent-muted)", listStyle: "none", padding: 0, margin: 0 }}>
          <li>• Data stays on this device only</li>
          <li>• {COPY.recordPaymentOnBills}</li>
          <li>• Set an end date on subscriptions to get a cancel reminder</li>
          <li>• Monthly and yearly items roll forward after you clear a cycle</li>
        </ul>
      </Card>
    </div>
  );
};

export default Add;
