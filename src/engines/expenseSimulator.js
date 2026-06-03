import { evaluateAffordability } from "./affordability.js";
import { totalMonthlyBurden, monthlyBurdenForDraft } from "./burden.js";
import { computeSurvivalAnalysis } from "./survival.js";

const PRESETS = {
  emi: { label: "New EMI", repeatType: "monthly", category: "EMI" },
  gadget: { label: "Gadget / purchase", repeatType: "none", category: "Other" },
  insurance: { label: "Insurance premium", repeatType: "yearly", category: "Insurance" },
  subscription: { label: "Subscription", repeatType: "monthly", category: "Subscription" },
  travel: { label: "Travel fund", repeatType: "none", category: "Other" },
  personal_loan: { label: "Personal loan EMI", repeatType: "monthly", category: "Loan" },
  home_loan: { label: "Home loan EMI", repeatType: "monthly", category: "Loan" },
  car_loan: { label: "Car loan EMI", repeatType: "monthly", category: "EMI" },
  salary_cut: { label: "Salary cut (−income)", repeatType: "none", category: "Other", incomeDelta: -5000 },
};

const MODE_PRESETS_SALARIED = {
  marriage: { label: "Wedding / marriage cost", repeatType: "none", category: "Other" },
  child: { label: "Child expenses / month", repeatType: "monthly", category: "Other" },
  job_loss: { label: "Job loss (zero income)", repeatType: "none", category: "Other", simulateZeroIncome: true },
  festival: { label: "Festival / gifts (one-off)", repeatType: "none", category: "Other" },
  salary_hike: { label: "Salary hike (+income)", repeatType: "none", category: "Other", incomeDelta: 5000 },
};

const MODE_PRESETS = {
  business: {
    vendor: { label: "Vendor payment", repeatType: "monthly", category: "Vendor" },
    payroll: { label: "Payroll / hire", repeatType: "monthly", category: "Payroll" },
    software: { label: "Software / SaaS", repeatType: "monthly", category: "Software" },
    equipment: { label: "Equipment", repeatType: "none", category: "Equipment" },
  },
  freelancer: {
    software: { label: "Software / tools", repeatType: "monthly", category: "Software" },
    client: { label: "Project cost", repeatType: "none", category: "Client" },
    subscription: { label: "Subscription", repeatType: "monthly", category: "Subscription" },
    equipment: { label: "Gear / equipment", repeatType: "none", category: "Equipment" },
  },
  student: {
    subscription: { label: "Subscription", repeatType: "monthly", category: "Subscription" },
    bnpl: { label: "BNPL purchase", repeatType: "monthly", category: "BNPL" },
    gadget: { label: "One-off purchase", repeatType: "none", category: "Other" },
    education: { label: "Course / fees", repeatType: "none", category: "Education" },
  },
  family: {
    insurance: { label: "Family insurance", repeatType: "yearly", category: "Insurance" },
    school: { label: "School fees", repeatType: "yearly", category: "School" },
    subscription: { label: "Subscription", repeatType: "monthly", category: "Subscription" },
    emi: { label: "Loan EMI", repeatType: "monthly", category: "EMI" },
    home_loan: { label: "Home loan EMI", repeatType: "monthly", category: "Loan" },
    child: { label: "Child / education monthly", repeatType: "monthly", category: "School" },
    marriage: { label: "Family event / wedding", repeatType: "none", category: "Other" },
    festival: { label: "Festival / gifts (one-off)", repeatType: "none", category: "Other" },
    salary_hike: { label: "Salary hike (+income)", repeatType: "none", category: "Other", incomeDelta: 5000 },
  },
  salaried: MODE_PRESETS_SALARIED,
};

import { getExperienceMode, isSalariedFamily } from "../constants/modeExperience.js";

export function getExpensePresetsForMode(modeOrSettings) {
  let mode = modeOrSettings;
  let household = false;
  if (typeof modeOrSettings === "object" && modeOrSettings !== null) {
    mode = getExperienceMode(modeOrSettings);
    household = isSalariedFamily(modeOrSettings);
  }
  if (mode === "salaried" || mode === "family") {
    const base = { ...PRESETS, ...MODE_PRESETS_SALARIED };
    if (household || mode === "family") {
      return { ...base, ...MODE_PRESETS.family };
    }
    return base;
  }
  return MODE_PRESETS[mode] || PRESETS;
}

/**
 * Simulate adding a new expense — affordability + survival impact.
 */
export function simulateNewExpense({
  income,
  commitments,
  getEffectiveStatus,
  liquidSavings,
  freeMoney,
  amount,
  preset = "emi",
  repeatType = undefined,
  category = undefined,
  mode = "salaried",
  loanMeta = null,
}) {
  const experienceMode = typeof mode === "object" && mode !== null ? getExperienceMode(mode) : mode;
  const catalog = getExpensePresetsForMode(mode);
  const p = catalog[preset] || PRESETS[preset] || PRESETS.emi;
  const draft = {
    amount: Math.max(0, Number(amount) || 0),
    remainingAmount: Math.max(0, Number(amount) || 0),
    repeatType: repeatType || p.repeatType,
    category: category || p.category,
    status: "pending",
  };
  const currentBurden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const proposed = monthlyBurdenForDraft(draft, getEffectiveStatus);
  const simIncome =
    p.simulateZeroIncome === true ? 0 : Math.max(0, income + (Number(p.incomeDelta) || 0));
  const inc = Math.max(0, simIncome);
  const aff = evaluateAffordability(inc, currentBurden, proposed);

  const beforeSurvival = computeSurvivalAnalysis({
    income: Math.max(0, income),
    freeMoney,
    liquidSavings,
    monthlyBurden: currentBurden,
  });
  const afterSurvival = computeSurvivalAnalysis({
    income: inc,
    freeMoney: aff.freeMoneyAfter,
    liquidSavings,
    monthlyBurden: aff.newTotalBurden,
  });

  const survivalDrop =
    beforeSurvival.survivalMonths != null && afterSurvival.survivalMonths != null
      ? Math.round((beforeSurvival.survivalMonths - afterSurvival.survivalMonths) * 10) / 10
      : null;

  const warnings = [];
  if (aff.tier === "dangerous" || aff.tier === "high_risk") {
    const incomeWord =
      experienceMode === "business" ? "revenue" : experienceMode === "student" ? "budget" : "income";
    warnings.push(`This raises commitments to about ${aff.committedPercent}% of ${incomeWord}.`);
  }
  if (aff.freeMoneyAfter < income * 0.15 && income > 0) {
    warnings.push("Free monthly cash drops below a healthy level.");
  }
  if (survivalDrop != null && survivalDrop >= 0.5) {
    warnings.push(`Survival runway may shrink by about ${survivalDrop} month(s) if income stops.`);
  }
  if (p.simulateZeroIncome) {
    warnings.push("Simulating job loss — income set to zero for this check.");
  }
  if (aff.committedPercent != null && aff.committedPercent >= 70) {
    warnings.push(
      `This may raise commitments to about ${aff.committedPercent}% of income and leave ~${Math.round(aff.freeMoneyAfter).toLocaleString("en-IN")} free cash.`
    );
  }
  const emergencyMonths =
    aff.freeMoneyAfter > 0 && aff.newTotalBurden > 0
      ? Math.round((liquidSavings + aff.freeMoneyAfter) / aff.newTotalBurden)
      : null;
  if (emergencyMonths != null && emergencyMonths < 4 && aff.newTotalBurden > 0) {
    warnings.push(`Emergency buffer may cover only ~${emergencyMonths} month(s) at this burn.`);
  }

  if (loanMeta?.totalInterest > 0) {
    warnings.push(
      `Total interest over the loan is about ₹${Math.round(loanMeta.totalInterest).toLocaleString("en-IN")} on top of principal.`
    );
  }

  return {
    preset: p.label,
    affordability: aff,
    beforeSurvival,
    afterSurvival,
    survivalDrop,
    warnings,
    loanMeta,
  };
}

export { PRESETS as EXPENSE_SIM_PRESETS };
