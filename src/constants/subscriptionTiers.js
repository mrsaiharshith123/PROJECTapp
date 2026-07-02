export const SUBSCRIPTION_TIERS = {
  free: "free",
  pro: "pro",
  power: "power",
};

/** Pro-only feature ids (Power includes these too). */
export const PRO_FEATURES = new Set([
  "account_backup",
  "health_report",
  "forecast_12m",
  "advanced_pressure",
  "unlimited_lending",
  "legal_agreement",
  "survival_scenarios",
  "full_income_tax",
  "cashflow_90d",
  "bank_import",
  "subscription_leak",
  "lifestyle_inflation",
  "unlimited_goals",
  "unlimited_daily_spend",
  "unlimited_bill_split",
  "unlimited_chits",
  "sip_advisor",
  "ai_advisor",
]);

/** Power-only feature ids (on top of Pro). */
export const POWER_FEATURES = new Set([
  "multiple_profiles",
  "bond_advisor",
  "payoff_optimizer",
  "ca_share",
]);

/** Discount shown on yearly billing toggle (~29% vs paying monthly × 12). */
export const YEARLY_SAVE_PERCENT = 29;

/**
 * @param {number} monthlyInr
 * @param {number} [savePercent]
 */
export function yearlyInrAfterSave(monthlyInr, savePercent = YEARLY_SAVE_PERCENT) {
  if (!monthlyInr) return 0;
  return Math.round(monthlyInr * 12 * (1 - savePercent / 100));
}

/** Effective monthly cost when billed annually. */
export function effectiveAnnualMonthlyInr(annualInr) {
  if (!annualInr) return 0;
  return Math.round(annualInr / 12);
}

/** @typedef {{ tier: string, titleKey: string, taglineKey: string, monthlyInr: number, annualInr: number, includesKey?: string, featureKeys: string[], featured?: boolean }} PlanPresentation */

/** @type {PlanPresentation[]} */
export const PLAN_PRESENTATION = [
  {
    tier: SUBSCRIPTION_TIERS.free,
    titleKey: "plans.tier.free",
    taglineKey: "plans.tagline.free",
    monthlyInr: 0,
    annualInr: 0,
    featureKeys: [
      "plans.feature.free.bills",
      "plans.feature.free.scores",
      "plans.feature.free.lending",
      "plans.feature.free.chitsGoals",
      "plans.feature.free.spendSplits",
      "plans.feature.free.cashflow",
      "plans.feature.free.calculators",
      "plans.feature.free.export",
      "plans.feature.free.report",
    ],
  },
  {
    tier: SUBSCRIPTION_TIERS.pro,
    titleKey: "plans.tier.pro",
    taglineKey: "plans.tagline.pro",
    monthlyInr: 99,
    annualInr: yearlyInrAfterSave(99),
    includesKey: "plans.includes.free",
    featured: true,
    featureKeys: [
      "plans.feature.pro.lending",
      "plans.feature.pro.cloud",
      "plans.feature.pro.cashflow",
      "plans.feature.pro.tax",
      "plans.feature.pro.bank",
      "plans.feature.pro.report",
      "plans.feature.pro.unlimited",
      "plans.feature.pro.insights",
      "plans.feature.pro.scenarios",
    ],
  },
  {
    tier: SUBSCRIPTION_TIERS.power,
    titleKey: "plans.tier.power",
    taglineKey: "plans.tagline.power",
    monthlyInr: 199,
    annualInr: yearlyInrAfterSave(199),
    includesKey: "plans.includes.pro",
    featureKeys: [
      "plans.feature.power.profiles",
      "plans.feature.power.bond",
      "plans.feature.power.payoff",
      "plans.feature.power.ca",
    ],
  },
];

export function hasPaidBackupTier(settings, serverTier = null) {
  const tier = serverTier ?? settings?.subscriptionTier ?? "free";
  return tier === SUBSCRIPTION_TIERS.pro || tier === SUBSCRIPTION_TIERS.power;
}

/**
 * @param {string} featureId
 * @param {string} [subscriptionTier]
 */
export function isFeatureUnlocked(featureId, subscriptionTier = "free") {
  const tier = subscriptionTier || "free";
  if (tier === "power") return true;
  if (POWER_FEATURES.has(featureId)) return false;
  if (PRO_FEATURES.has(featureId)) return tier === "pro";
  return true;
}
