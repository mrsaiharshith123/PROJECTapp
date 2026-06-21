import { getCategoryById } from "./categories.js";
import { USER_MODE_IDS, REMOVED_USER_MODE_IDS } from "./userModes.js";

/** Bill category ids shown when adding a commitment. */
export const MODE_CATEGORY_IDS = {
  salaried: ["EMI", "Credit Card", "Subscription", "Insurance", "SIP", "Chit Fund", "Rent", "Loan", "Utility", "Other"],
  family: ["Rent", "School", "Insurance", "Groceries", "EMI", "Chit Fund", "Subscription", "Utility", "Loan", "Other"],
  power: ["EMI", "Credit Card", "Subscription", "Insurance", "SIP", "Chit Fund", "Rent", "Loan", "Utility", "Other"],
};

/** Quick calculator tool ids per mode (Home dashboard). Safety lives under Profile. */
const TOOL_ORDER = [
  "planner",
  "advisor",
  "incomeTax",
  "retirement",
  "goals",
  "invest",
  "chit",
  "insurance",
];

export const MODE_TOOL_IDS = {
  salaried: TOOL_ORDER,
  family: TOOL_ORDER,
  power: TOOL_ORDER,
};

/** Scope-gated product features (single vs household vs both). */
export const SCOPE_FEATURES = {
  single: [
    "paycheck_autopsy",
    "personal_cibil_sim",
    "salary_day_mode",
    "individual_survival",
    "personal_goals",
  ],
  household: [
    "combined_income_display",
    "spouse_income_field",
    "school_fees_banner",
    "family_emergency_target",
    "household_pressure_score",
    "family_cashflow_calendar",
    "festival_planner",
    "dependent_tracker",
    "per_member_expense",
    "household_runway",
    "shared_goals",
    "renewal_alerts",
    "household_entity_card",
  ],
  both: [
    "commitments",
    "lending",
    "chit_fund",
    "income_tax",
    "retirement_suite",
    "net_worth",
    "daily_spends",
    "bill_split",
    "analytics",
    "ai_advisor",
    "goals",
    "survival_basic",
    "pressure_score",
    "bank_import",
    "notification_smart",
    "annual_report",
  ],
};

/** @param {string} featureId @param {"single" | "family"} householdScope */
export function isFeatureForScope(featureId, householdScope) {
  if (SCOPE_FEATURES.both.includes(featureId)) return true;
  if (householdScope === "family") return SCOPE_FEATURES.household.includes(featureId);
  return SCOPE_FEATURES.single.includes(featureId);
}

/** @param {"single" | "family"} householdScope */
export function getScopeOnlyFeatures(householdScope) {
  if (householdScope === "family") return SCOPE_FEATURES.household;
  return SCOPE_FEATURES.single;
}

export const MODE_TOOL_DEFS = {
  planner: {
    id: "planner",
    title: "Plan & decide",
    subtitle: "Afford · scenarios · analysis",
    accent: "indigo",
  },
  advisor: {
    id: "advisor",
    title: "Ask your finances",
    subtitle: "AI advisor on your numbers",
    accent: "indigo",
  },
  loan: {
    id: "loan",
    title: "Loan helpers",
    subtitle: "Extra EMI · best month to pay",
    accent: "violet",
  },
  insurance: {
    id: "insurance",
    title: "Insurance",
    subtitle: "Evaluate policy value",
    accent: "teal",
  },
  chit: {
    id: "chit",
    title: "Chit timing",
    subtitle: "When to take the pot",
    accent: "yellow",
  },
  bond: {
    id: "bond",
    title: "Bond check",
    subtitle: "Evaluate bond suitability",
    accent: "indigo",
  },
  incomeTax: {
    id: "incomeTax",
    title: "Tax & HRA",
    subtitle: "Salary tax · rent exemption",
    accent: "teal",
  },
  retirement: {
    id: "retirement",
    title: "Retirement",
    subtitle: "EPF · PPF · NPS · gratuity",
    accent: "indigo",
  },
  safety: {
    id: "safety",
    title: "Safety & emergency",
    subtitle: "Liquid reserve target",
    accent: "violet",
  },
  invest: {
    id: "invest",
    title: "Invest & save",
    subtitle: "SIP · FD · RD",
    accent: "teal",
  },
  goals: {
    id: "goals",
    title: "Financial goals",
    subtitle: "Save · debt · education",
    accent: "yellow",
  },
};

const MODE_TOOL_TITLES = {
  family: {
    planner: { title: "Household planner", subtitle: "Afford · scenarios · goals" },
  },
};

export const MODE_ANALYTICS = {
  salaried: {
    monthTitle: "Paycheck this month",
    monthHint: "Salary vs what is due, paid, and left this month.",
    affordTitle: "Salary vs monthly bills",
    affordHint: "Income minus estimated monthly dues — your paycheck pressure read.",
    showPaycheckFlow: true,
  },
  family: {
    monthTitle: "Household month",
    monthHint: "Shared income vs family bills due this month.",
    affordTitle: "Household income vs bills",
    affordHint: "What the home keeps after monthly obligations.",
    showPaycheckFlow: true,
  },
  power: {
    monthTitle: "This month",
    monthHint: "Full month cashflow summary.",
    affordTitle: "Income vs obligations",
    affordHint: "Advanced burden and free-cash read.",
    showPaycheckFlow: true,
  },
};

export function resolveUserMode(settings) {
  const raw = settings?.userMode || "salaried";
  if (raw === "family" || raw === "power" || REMOVED_USER_MODE_IDS.includes(raw)) return "salaried";
  return USER_MODE_IDS.includes(raw) ? raw : "salaried";
}

/** Salaried user managing a family household (merged former “family” mode). */
export function isSalariedFamily(settings) {
  if (!settings) return false;
  if (settings.userMode === "family") return true;
  return resolveUserMode(settings) === "salaried" && settings.householdScope === "family";
}

/** Subscription unlocks power features without a separate mode pick. */
export function hasPowerFeatures(settings) {
  if (!settings) return false;
  return settings.subscriptionTier === "power" || settings.userMode === "power";
}

/** Drives categories, tools, analytics copy, and intel engines. */
export function getExperienceMode(settings) {
  if (hasPowerFeatures(settings)) return "power";
  if (isSalariedFamily(settings)) return "family";
  return resolveUserMode(settings);
}

/** i18n key for income field label. */
export function getIncomeLabelKey(settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  if (mode === "family") return "income.household";
  if (mode === "power") return "income.monthly";
  return "income.monthlySalary";
}

/**
 * Profile scope for spends / wealth. `null` = entire household (family mode).
 * @param {object | null | undefined} settings
 * @returns {string | null}
 */
export function resolveDataProfileScope(settings) {
  if (isSalariedFamily(settings)) return null;
  return settings?.activeProfileId || "default";
}

/**
 * Profile scope for analytics: family mode can view self only or full household.
 * @param {object | null | undefined} settings
 * @param {"self" | "household"} [view]
 * @returns {string | null}
 */
export function resolveAnalyticsProfileScope(settings, view = "household") {
  if (!isSalariedFamily(settings)) return settings?.activeProfileId || "default";
  if (view === "self") return settings?.activeProfileId || "default";
  return null;
}

/** Icon + label key for mode badge in profile / home. */
export function getHouseholdModeDisplay(settings) {
  if (isSalariedFamily(settings)) return { icon: "users-three", labelKey: "mode.family" };
  if (hasPowerFeatures(settings)) return { icon: "lightning", labelKey: "brand.proSuffix" };
  return { icon: "briefcase", labelKey: "mode.salaried" };
}

export function getAnalyticsCopy(settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  return MODE_ANALYTICS[mode] || MODE_ANALYTICS.salaried;
}

export function getCategoriesForUserMode(settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  const ids = MODE_CATEGORY_IDS[mode] || MODE_CATEGORY_IDS.salaried;
  return ids.map((id) => getCategoryById(id));
}

/**
 * @typedef {{ id: string, title: string, subtitle?: string, accent?: string }} DashboardToolDef
 * @returns {DashboardToolDef[]}
 */
export function getToolsForMode(settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  const ids = MODE_TOOL_IDS[mode] || MODE_TOOL_IDS.salaried;
  const overrides = MODE_TOOL_TITLES[mode] || {};
  return ids
    .map((id) => {
      const base = MODE_TOOL_DEFS[id];
      if (!base) return null;
      return { ...base, ...(overrides[id] || {}) };
    })
    .filter(Boolean);
}

/** @param {string | object} settingsOrMode */
export function getDashboardToolsHeadingKey(settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  if (mode === "family") return "tools.householdTools";
  if (mode === "power") return "tools.powerTools";
  return "tools.salaryTools";
}

/** @param {string} toolId @param {string | object} settingsOrMode */
export function getToolTileKeys(toolId, settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  if (mode === "family" && toolId === "planner") {
    return { titleKey: "tools.householdPlanner.title", subtitleKey: "tools.householdPlanner.subtitle" };
  }
  return { titleKey: `tools.${toolId}.title`, subtitleKey: `tools.${toolId}.subtitle` };
}

/** @param {object | null | undefined} settings @param {string} singleKey @param {string} familyKey */
export function familyTextKey(settings, singleKey, familyKey) {
  return isSalariedFamily(settings) ? familyKey : singleKey;
}

/**
 * Resolve i18n key for single vs family household copy.
 * @param {Function} t
 * @param {object} settings
 * @param {string} singleKey
 * @param {string} familyKey
 * @param {Record<string, unknown>} [params]
 */
export function tFamily(t, settings, singleKey, familyKey, params = undefined) {
  const key = familyTextKey(settings, singleKey, familyKey);
  return params ? t(key, params) : t(key);
}

export function showSalariedStabilityCards(settings) {
  if (typeof settings === "object") {
    const base = resolveUserMode(settings);
    return base === "salaried" || hasPowerFeatures(settings);
  }
  return settings === "salaried" || settings === "family" || settings === "power";
}
