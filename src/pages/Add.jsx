import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { categoryShowsInterestRate, categoryShowsInsuranceFields } from "../constants/categories.js";
import { getCategoriesForUserMode } from "../constants/modeExperience.js";
import InsuranceFields from "../components/InsuranceFields.jsx";
import {
  emptyInsuranceFields,
  buildInsuranceBillName,
  insuranceBillHasIdentity,
  repeatTypeToPremiumFrequency,
} from "../constants/insurance.js";
import { inferPriorityFromCategory, OTHER_PRIORITY_OPTIONS } from "../constants/priority.js";
import { COPY } from "../constants/copy.js";
import { evaluateNewCommitmentAffordability, affordabilityBadgeClass } from "../engines/affordability.js";
import { getUserModeConfig } from "../constants/userModes.js";
import { estimatePriorSpend } from "../utils/billLifecycle.js";
import {
  applyBillRepeatChange,
  applyBillStartDateChange,
  defaultEndDateFromStart,
} from "../utils/billDates.js";
import { isEnhancedUi } from "../constants/uiTheme.js";
import { REPEAT_OPTIONS } from "../constants/repeatTypes.js";

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
    annualInterestRate: "",
    ...emptyInsuranceFields(),
  });
  const [errors, setErrors] = useState({});

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
      }
      return next;
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
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      errs.amount = "Enter a valid amount";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      errs.endDate = "End date must be on or after start date";
    }
    const due = form.dueDate || form.startDate;
    if (!due) errs.dueDate = "Next payment due is required";
    return errs;
  };

  const mode = settings.userMode || "salaried";
  const modeCfg = getUserModeConfig(mode);
  const billCategories = getCategoriesForUserMode(mode);
  const showAffordability = modeCfg.showAffordabilityOnAdd;
  const category = form.category || "Other";
  const showInterest = categoryShowsInterestRate(category);
  const showInsurance = categoryShowsInsuranceFields(category);
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
    const income = Math.max(0, Number(settings.monthlyIncome) || 0);
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
    todayStr,
    getEffectiveStatus,
  ]);

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const dueDate = form.dueDate || form.startDate;
    const billName = showInsurance
      ? buildInsuranceBillName(form) || form.name.trim() || "Insurance policy"
      : form.name.trim();

    const draft = {
      id: Date.now(),
      name: billName,
      amount: Number(form.amount),
      startDate: form.startDate,
      endDate: form.endDate || "",
      dueDate,
      category,
      repeatType: form.repeatType,
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

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition ${
      isEnhancedUi() ? "ui-input" : ""
    } ${errors[field] ? "border-red-300 bg-red-50" : "border-gray-200 dark:border-slate-600"}`;

  const displayFont = isEnhancedUi() ? "font-display" : "";

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <p className="text-sm text-gray-400 dark:text-slate-500 font-medium uppercase tracking-widest">New entry</p>
        <h1 className={`text-3xl font-bold text-gray-900 dark:text-slate-100 mt-1 ${displayFont}`}>
          {COPY.addBill}
        </h1>
      </div>

      <Card className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Category</label>
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Amount to pay (₹)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className={`${inputClass("amount")} pl-8`}
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Next payment due</label>
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Repeat</label>
          <select name="repeatType" value={form.repeatType} onChange={handleChange} className={inputClass("repeatType")}>
            {REPEAT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {isOther && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Priority</label>
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
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
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
            placeholder={showInsurance ? "Nickname only if you want" : "e.g. Bike EMI, Netflix, Rent"}
            className={inputClass("name")}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {showInterest && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
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

        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full py-3.5 text-white font-semibold rounded-xl transition-all duration-200 active:scale-95 ${
            isEnhancedUi()
              ? "ui-btn-primary hover:brightness-110"
              : "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
          } ${displayFont}`}
        >
          {COPY.addBill}
        </button>
      </Card>

      {affordability && (
        <Card className="space-y-2 border-indigo-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Affordability</span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${affordabilityBadgeClass(affordability.tier)}`}
            >
              {affordability.label}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            After adding: ~₹{Math.round(affordability.newTotalBurden).toLocaleString()}/mo burden vs income (
            {affordability.committedPercent != null ? `${affordability.committedPercent}%` : "—"} committed). Free
            money ≈ ₹{Math.round(affordability.freeMoneyAfter).toLocaleString()}.
          </p>
          <p className="text-[11px] text-gray-400">Set monthly income in Profile if this shows “—”.</p>
        </Card>
      )}

      <Card className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800">
        <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-200 mb-2">Quick tips</p>
        <ul className="space-y-1.5 text-xs text-indigo-600 dark:text-indigo-300/90">
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
