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
    warnings.push({ key: "afford.warningCommitted", params: { percent: aff.committedPercent ?? 0 } });
  }
  if (aff.freeMoneyAfter < income * 0.15 && income > 0) {
    warnings.push({ key: "afford.warningLowCash" });
  }
  if (survivalDrop != null && survivalDrop >= 0.5) {
    warnings.push({ key: "afford.warningSurvival", params: { months: survivalDrop } });
  }
  if (p.simulateZeroIncome) {
    warnings.push({ key: "afford.warningJobLoss" });
  }
  if (aff.committedPercent != null && aff.committedPercent >= 70) {
    warnings.push({
      key: "afford.warningHighCommit",
      params: {
        percent: aff.committedPercent,
        amount: Math.round(aff.freeMoneyAfter).toLocaleString("en-IN"),
      },
    });
  }
  const emergencyMonths =
    aff.freeMoneyAfter > 0 && aff.newTotalBurden > 0
      ? Math.round((liquidSavings + aff.freeMoneyAfter) / aff.newTotalBurden)
      : null;
  if (emergencyMonths != null && emergencyMonths < 4 && aff.newTotalBurden > 0) {
    warnings.push({ key: "afford.warningEmergency", params: { months: emergencyMonths } });
  }

  if (loanMeta?.totalInterest > 0) {
    warnings.push({
      key: "afford.warningInterest",
      params: { amount: `₹${Math.round(loanMeta.totalInterest).toLocaleString("en-IN")}` },
    });
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
