import { getCategoryById } from "./categories.js";
import { USER_MODE_IDS } from "./userModes.js";

/** Income field label in Profile / Analytics. */
export const MODE_INCOME_LABEL = {
  salaried: "Monthly salary",
  business: "Monthly revenue",
  freelancer: "Typical monthly income",
  family: "Household income",
  student: "Monthly budget / allowance",
  power: "Monthly income",
};

/** Bill category ids shown when adding a commitment. */
export const MODE_CATEGORY_IDS = {
  salaried: ["EMI", "Credit Card", "Subscription", "Insurance", "SIP", "Chit Fund", "Rent", "Loan", "Utility", "Other"],
  business: ["Vendor", "Payroll", "Rent", "Software", "Tax", "EMI", "Utility", "Insurance", "Other"],
  freelancer: ["Client", "Software", "Subscription", "Tax", "Equipment", "Insurance", "Utility", "Other"],
  family: ["Rent", "School", "Insurance", "Groceries", "EMI", "Chit Fund", "Subscription", "Utility", "Loan", "Other"],
  student: ["Subscription", "Education", "Transport", "Food", "BNPL", "Loan", "Other"],
  power: ["EMI", "Credit Card", "Subscription", "Insurance", "SIP", "Rent", "Loan", "Utility", "Vendor", "Other"],
};

/** Quick calculator tool ids per mode. */
export const MODE_TOOL_IDS = {
  salaried: ["afford", "scenarios", "insurance", "emi", "loanTiming", "payoff", "chit", "bond", "goals"],
  business: ["afford", "bond", "goals"],
  freelancer: ["afford", "scenarios", "payoff", "bond", "goals", "emi", "loanTiming"],
  family: ["afford", "scenarios", "insurance", "emi", "loanTiming", "chit", "bond", "goals"],
  student: ["afford", "loanTiming", "bond", "goals"],
  power: ["afford", "scenarios", "insurance", "emi", "loanTiming", "payoff", "chit", "bond", "goals"],
};

export const MODE_TOOL_DEFS = {
  afford: {
    id: "afford",
    title: "Can I afford this?",
    subtitle: "Try a purchase before you commit",
    accent: "indigo",
  },
  scenarios: {
    id: "scenarios",
    title: "What-if stress test",
    subtitle: "Job loss, fees, partner income",
    accent: "rose",
  },
  insurance: {
    id: "insurance",
    title: "Insurance",
    subtitle: "Was the policy worth it?",
    accent: "teal",
  },
  emi: {
    id: "emi",
    title: "Pay loan faster",
    subtitle: "Extra EMI savings",
    accent: "violet",
  },
  payoff: {
    id: "payoff",
    title: "Which debt first?",
    subtitle: "Smallest vs highest rate",
    accent: "amber",
  },
  goals: {
    id: "goals",
    title: "Savings goals",
    subtitle: "Track a target",
    accent: "indigo",
  },
  chit: {
    id: "chit",
    title: "Chit timing",
    subtitle: "When to take the pot",
    accent: "yellow",
  },
  loanTiming: {
    id: "loanTiming",
    title: "Loan extra pay",
    subtitle: "Best month to pay more",
    accent: "violet",
  },
  bond: {
    id: "bond",
    title: "Bond check",
    subtitle: "Is this bond worth it?",
    accent: "indigo",
  },
};

const MODE_TOOL_TITLES = {
  business: {
    afford: { title: "Can we afford this?", subtitle: "Vendor, hire, or equipment cost" },
    goals: { title: "Business targets", subtitle: "Cash buffer or paydown goals" },
  },
  freelancer: {
    afford: { title: "Can I take this cost?", subtitle: "Gear, software, or contract spend" },
  },
  student: {
    afford: { title: "Can I afford this?", subtitle: "Subs, BNPL, or one-off spend" },
    goals: { title: "Savings goals", subtitle: "Emergency or semester fund" },
  },
  family: {
    afford: { title: "Household affordability", subtitle: "New bill impact on the home" },
    scenarios: { title: "Household what-ifs", subtitle: "Second income, fees, shocks" },
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
  business: {
    monthTitle: "Cashflow this month",
    monthHint: "Revenue vs vendor bills, payroll, and operating costs due this month.",
    affordTitle: "Revenue vs operating costs",
    affordHint: "Monthly revenue minus recurring business obligations.",
    showPaycheckFlow: false,
  },
  freelancer: {
    monthTitle: "Income this month",
    monthHint: "Typical income vs client bills and tools due this month.",
    affordTitle: "Income vs monthly costs",
    affordHint: "Buffer after recurring client and business costs.",
    showPaycheckFlow: false,
  },
  family: {
    monthTitle: "Household month",
    monthHint: "Shared income vs family bills due this month.",
    affordTitle: "Household income vs bills",
    affordHint: "What the home keeps after monthly obligations.",
    showPaycheckFlow: true,
  },
  student: {
    monthTitle: "Budget this month",
    monthHint: "Allowance or income vs subs and dues this month.",
    affordTitle: "Budget vs spending",
    affordHint: "Simple read on whether this month is within budget.",
    showPaycheckFlow: false,
  },
  power: {
    monthTitle: "This month",
    monthHint: "Full month cashflow summary.",
    affordTitle: "Income vs obligations",
    affordHint: "Advanced burden and free-cash read.",
    showPaycheckFlow: true,
  },
};

export const MODE_DASHBOARD_TOOLS_HEADING = {
  salaried: "Salary tools",
  business: "Business tools",
  freelancer: "Freelancer tools",
  family: "Household tools",
  student: "Student tools",
  power: "Power tools",
};

export function resolveUserMode(settings) {
  const raw = settings?.userMode || "salaried";
  if (raw === "family" || raw === "power") return "salaried";
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

export function getIncomeLabel(settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  return MODE_INCOME_LABEL[mode] || MODE_INCOME_LABEL.salaried;
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

export function getDashboardToolsHeading(settingsOrMode) {
  const mode =
    typeof settingsOrMode === "object" && settingsOrMode !== null
      ? getExperienceMode(settingsOrMode)
      : settingsOrMode || "salaried";
  if (mode === "family") return MODE_DASHBOARD_TOOLS_HEADING.family;
  return MODE_DASHBOARD_TOOLS_HEADING[mode] || "Quick calculators";
}

export function showHomeRolePanel(settings) {
  const mode = typeof settings === "object" ? getExperienceMode(settings) : settings;
  return mode !== "salaried";
}

export function showSalariedStabilityCards(settings) {
  if (typeof settings === "object") {
    const base = resolveUserMode(settings);
    return base === "salaried" || hasPowerFeatures(settings);
  }
  return settings === "salaried" || settings === "family" || settings === "power";
}
