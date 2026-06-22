import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fieldInputClass, PageShell, Button } from "../../";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import {
  categoryShowsInterestRate,
  categoryShowsInsuranceFields,
  categoryShowsChitFundFields,
} from "../../../constants/categories.js";
import {
  emptyChitFundFields,
  buildChitPayloadFromForm,
  chitFundHasRequiredFields,
  chitEndDateFromStart,
  applyChitFormSync,
  categoryIsChitFund,
} from "../../../constants/chitFund.js";
import { getCategoriesForUserMode, isSalariedFamily } from "../../../constants/modeExperience.js";
import {
  emptyInsuranceFields,
  buildInsuranceBillName,
  insuranceBillHasIdentity,
  repeatTypeToPremiumFrequency,
} from "../../../constants/insurance.js";
import { inferPriorityFromCategory } from "../../../constants/priority.js";
import { evaluateNewCommitmentAffordability } from "../../../engines/affordability.js";
import { getUserModeConfig } from "../../../constants/userModes.js";
import { estimatePriorSpend } from "../../../utils/billLifecycle.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import {
  applyBillRepeatChange,
  applyBillStartDateChange,
  defaultEndDateFromStart,
} from "../../../utils/billDates.js";
import AddCommitmentForm from "../forms/AddCommitmentForm.jsx";
import AddTypePicker from "../add/AddTypePicker.jsx";
import { buildLendingRecord } from "../../../utils/lendingRecord.js";
import { canAddChitRecord, canAddLendingRecord } from "../../../utils/tierAccess.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const Add = () => {
  const { t } = useTranslation();
  const { addCommitment, addLending, commitments, lendings, settings, todayStr, getEffectiveStatus } =
    usePerovo();
  const navigate = useNavigate();
  const [step, setStep] = useState(/** @type {"pick" | "form"} */ ("pick"));
  const [addKind, setAddKind] = useState(/** @type {"bill" | "spend" | "lending" | null} */ (null));
  const [entryType, setEntryType] = useState("scheduled");
  const [lendingForm, setLendingForm] = useState({
    personName: "",
    type: "lent",
    totalAmount: "",
    dueDate: "",
  });
  const [form, setForm] = useState({
    name: "",
    amount: "",
    startDate: "",
    endDate: "",
    dueDate: "",
    category: "",
    repeatType: "monthly",
    priority: "medium",
    notes: "",
    householdPayer: "",
    forMember: "shared",
    annualInterestRate: "",
    ...emptyInsuranceFields(),
    ...emptyChitFundFields(),
  });
  const [errors, setErrors] = useState(/** @type {Record<string, string>} */ ({}));

  const handlePick = (id) => {
    setAddKind(/** @type {"bill" | "spend" | "lending"} */ (id));
    setStep("form");
    if (id === "spend") setEntryType("variable");
    else setEntryType("scheduled");
  };

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

  const handleChitChange = (name, value) => {
    setForm((f) => applyChitFormSync({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleInsuranceChange = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
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
      todayStr,
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

    if (showChit) {
      const chitGate = canAddChitRecord(settings, commitments, getEffectiveStatus);
      if (!chitGate.ok) {
        setErrors({ chitValue: t("tier.limit.chitMessage", { limit: chitGate.limit }) });
        return;
      }
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
      forMember: salariedFamily ? form.forMember || "shared" : "shared",
    };
    const effective = getEffectiveStatus({
      ...draft,
      remainingAmount: Number(form.amount),
    });

    addCommitment({
      ...draft,
      status: effective === "overdue" ? "overdue" : "pending",
    });
    navigate("/money/bills");
  };

  const submitLending = () => {
    const errs = {};
    if (!lendingForm.personName.trim()) errs.personName = "Name is required";
    if (!lendingForm.totalAmount || Number(lendingForm.totalAmount) <= 0) {
      errs.totalAmount = "Enter a valid amount";
    }
    if (!lendingForm.dueDate) errs.dueDate = "Due date is required";
    if (Object.keys(errs).length) {
      setErrors(/** @type {Record<string, string>} */ (/** @type {unknown} */ (errs)));
      return;
    }
    const gate = canAddLendingRecord(settings, lendings);
    if (!gate.ok) return;
    addLending(
      buildLendingRecord({
        type: lendingForm.type,
        personName: lendingForm.personName.trim(),
        totalAmount: lendingForm.totalAmount,
        dueDate: lendingForm.dueDate,
        interestRate: 0,
        notes: "",
        relationshipTag: "Other",
        extra: {
          startDate: lendingForm.dueDate,
          endDate: "",
          interestType: "simple",
          repaymentFrequency: "monthly",
          repaymentType: "monthly",
        },
      }),
    );
    navigate("/money/lending");
  };

  const fieldClass = (field) => `${fieldInputClass(Boolean(errors[field]))} ct-input-tint`;

  const formTitle =
    addKind === "bill"
      ? t("add.pick.bill")
      : addKind === "spend"
        ? t("add.pick.spend")
        : addKind === "lending"
          ? t("add.pick.lending")
          : t("add.title");

  const headerAction =
    step === "pick" ? (
      <button type="button" className="ct-btn ct-btn-ghost ct-btn-sm" onClick={() => navigate(-1)} aria-label={t("common.close")}>
        ×
      </button>
    ) : (
      <button
        type="button"
        className="ct-btn ct-btn-ghost ct-btn-sm"
        onClick={() => {
          setStep("pick");
          setAddKind(null);
          setErrors({});
        }}
        aria-label={t("common.back")}
      >
        ←
      </button>
    );

  return (
    <PageShell title={step === "pick" ? t("add.title") : formTitle} action={headerAction} className="ct-add-page ct-form-narrow">
      {step === "pick" ? (
        <AddTypePicker onSelect={handlePick} />
      ) : addKind === "lending" ? (
        <div className="ct-stack ct-add-form-embedded">
          <div className="ct-hero-card lending relative ct-stack-sm">
            <div className="ct-hero-glow teal" aria-hidden />
            <p className="ct-hero-label">{t("add.pick.lending")}</p>
            <p className="ct-analytics-section-sub mt-1 relative">{t("add.pick.lendingDesc")}</p>
          </div>
          <div>
            <label className="ct-field-label">{t("add.lendingPersonName")}</label>
            <input
              type="text"
              value={lendingForm.personName}
              onChange={(e) => setLendingForm((f) => ({ ...f, personName: e.target.value }))}
              className={fieldClass("personName")}
            />
          </div>
          <div>
            <label className="ct-field-label">{t("add.amountLabel")}</label>
            <input
              type="number"
              value={lendingForm.totalAmount}
              onChange={(e) => setLendingForm((f) => ({ ...f, totalAmount: e.target.value }))}
              className={fieldClass("totalAmount")}
            />
          </div>
          <div className="ct-grid-2">
            <button
              type="button"
              className={`ct-add-type-mini ${lendingForm.type === "lent" ? "active" : ""}`}
              onClick={() => setLendingForm((f) => ({ ...f, type: "lent" }))}
            >
              {t("lending.sectionLent")}
            </button>
            <button
              type="button"
              className={`ct-add-type-mini ${lendingForm.type === "borrowed" ? "active" : ""}`}
              onClick={() => setLendingForm((f) => ({ ...f, type: "borrowed" }))}
            >
              {t("lending.sectionOwe")}
            </button>
          </div>
          <div>
            <label className="ct-field-label">{t("add.dueDateLabel")}</label>
            <input
              type="date"
              value={lendingForm.dueDate}
              onChange={(e) => setLendingForm((f) => ({ ...f, dueDate: e.target.value }))}
              className={fieldClass("dueDate")}
            />
          </div>
          <Button type="button" size="lg" className="ct-add-submit-sticky" onClick={submitLending}>
            {t("add.submitLending")}
          </Button>
        </div>
      ) : (
        <>
          {addKind === "bill" && (
            <button type="button" className="ct-tool-tile ct-add-scan-tile w-full" onClick={() => navigate("/tools?tool=bill-scanner")}>
              <span className="ct-icon-tile primary shrink-0" aria-hidden>
                <CtIcon name="camera" size={24} />
              </span>
              <span>
                <strong>{t("add.scanTileTitle")}</strong>
                <span className="block">{t("add.scanTileHint")}</span>
              </span>
            </button>
          )}
          <AddCommitmentForm
            entryType={entryType}
            onEntryTypeChange={setEntryType}
            onVariableSaved={() => navigate("/money/spends")}
            form={form}
            errors={errors}
            fieldClass={fieldClass}
            billCategories={billCategories}
            showChit={showChit}
            showInsurance={showInsurance}
            showInterest={showInterest}
            isSubscription={isSubscription}
            isOther={isOther}
            category={category}
            salariedFamily={salariedFamily}
            priorSpendHint={priorSpendHint}
            todayStr={todayStr}
            affordability={affordability}
            onChange={handleChange}
            onChitChange={handleChitChange}
            onInsuranceChange={handleInsuranceChange}
            onFillEndDate={fillEndDateIfEmpty}
            onSubmit={handleSubmit}
            embedded
            hideTypeSwitcher
          />
        </>
      )}
    </PageShell>
  );
};

export default Add;
