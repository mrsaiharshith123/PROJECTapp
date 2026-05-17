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
  },
};

export function getExpensePresetsForMode(mode) {
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
  repeatType,
  category,
  mode = "salaried",
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
  const aff = evaluateAffordability(income, currentBurden, proposed);

  const beforeSurvival = computeSurvivalAnalysis({
    income,
    freeMoney,
    liquidSavings,
    monthlyBurden: currentBurden,
  });
  const afterSurvival = computeSurvivalAnalysis({
    income,
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
    const incomeWord = mode === "business" ? "revenue" : mode === "student" ? "budget" : "income";
    warnings.push(`This raises commitments to about ${aff.committedPercent}% of ${incomeWord}.`);
  }
  if (aff.freeMoneyAfter < income * 0.15 && income > 0) {
    warnings.push("Free monthly cash drops below a healthy level.");
  }
  if (survivalDrop != null && survivalDrop >= 0.5) {
    warnings.push(`Survival runway may shrink by about ${survivalDrop} month(s) if income stops.`);
  }

  return {
    preset: p.label,
    affordability: aff,
    beforeSurvival,
    afterSurvival,
    survivalDrop,
    warnings,
  };
}

export { PRESETS as EXPENSE_SIM_PRESETS };
