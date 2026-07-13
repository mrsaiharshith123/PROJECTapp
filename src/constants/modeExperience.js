import { getCategoryById } from "./categories.js";
import { USER_MODE_IDS, REMOVED_USER_MODE_IDS } from "./userModes.js";

/** Bill category ids shown when adding a commitment. */
export const MODE_CATEGORY_IDS = {
  salaried: ["EMI", "Credit Card", "Subscription", "Insurance", "SIP", "Chit Fund", "Rent", "Loan", "Utility", "Family Support", "Other"],
  power: ["EMI", "Credit Card", "Subscription", "Insurance", "SIP", "Chit Fund", "Rent", "Loan", "Utility", "Family Support", "Other"],
};

/** Quick calculator tool ids per mode (Home dashboard). */
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
  power: TOOL_ORDER,
};

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

export const MODE_ANALYTICS = {
  salaried: {
    monthTitle: "Paycheck this month",
    monthHint: "Salary vs what is due, paid, and left this month.",
    affordTitle: "Salary vs monthly bills",
    affordHint: "Income minus estimated monthly dues — your paycheck pressure read.",
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
  if (raw === "power" || REMOVED_USER_MODE_IDS.includes(raw)) return "salaried";
  return USER_MODE_IDS.includes(raw) ? raw : "salaried";
}

/** Subscription unlocks power features without a separate mode pick. */
export function hasPowerFeatures(settings, serverTier = null) {
  if (!settings) return false;
  const tier = serverTier ?? settings.subscriptionTier ?? "free";
  return tier === "power" || settings.userMode === "power";
}

/** Drives categories, tools, analytics copy, and intel engines. */
export function getExperienceMode(settings, serverTier = null) {
  if (hasPowerFeatures(settings, serverTier)) return "power";
  return resolveUserMode(settings);
}

/** i18n key for income field label. */
export function getIncomeLabelKey(settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  if (mode === "power") return "income.monthly";
  return "income.monthlySalary";
}

/**
 * Profile scope for spends / wealth.
 * @param {object | null | undefined} settings
 * @returns {string | null}
 */
export function resolveDataProfileScope(settings) {
  return settings?.activeProfileId || "default";
}

/**
 * Profile scope for analytics.
 * @param {object | null | undefined} settings
 */
export function resolveAnalyticsProfileScope(settings) {
  return settings?.activeProfileId || "default";
}

/** Icon + label key for mode badge in profile / home. */
export function getModeDisplay(settings) {
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
  return ids
    .map((id) => {
      const base = MODE_TOOL_DEFS[id];
      if (!base) return null;
      return { ...base };
    })
    .filter(Boolean);
}

/** @param {string | object} settingsOrMode */
export function getDashboardToolsHeadingKey(settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  if (mode === "power") return "tools.powerTools";
  return "tools.salaryTools";
}

/** @param {string} toolId @param {string | object} _settingsOrMode */
export function getToolTileKeys(toolId, _settingsOrMode) {
  return { titleKey: `tools.${toolId}.title`, subtitleKey: `tools.${toolId}.subtitle` };
}

export function showSalariedStabilityCards(settings) {
  if (typeof settings === "object") {
    const base = resolveUserMode(settings);
    return base === "salaried" || hasPowerFeatures(settings);
  }
  return settings === "salaried" || settings === "power";
}

