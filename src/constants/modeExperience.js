import { getCategoryById } from "./categories.js";

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
  salaried: ["afford", "scenarios", "insurance", "emi", "loanTiming", "payoff", "chit", "goals"],
  business: ["afford", "goals"],
  freelancer: ["afford", "scenarios", "payoff", "goals", "emi", "loanTiming"],
  family: ["afford", "scenarios", "insurance", "emi", "loanTiming", "chit", "goals"],
  student: ["afford", "loanTiming", "goals"],
  power: ["afford", "scenarios", "insurance", "emi", "loanTiming", "payoff", "chit", "goals"],
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
  return settings?.userMode || "salaried";
}

export function getIncomeLabel(mode) {
  return MODE_INCOME_LABEL[mode] || MODE_INCOME_LABEL.salaried;
}

export function getAnalyticsCopy(mode) {
  return MODE_ANALYTICS[mode] || MODE_ANALYTICS.salaried;
}

export function getCategoriesForUserMode(mode) {
  const ids = MODE_CATEGORY_IDS[mode] || MODE_CATEGORY_IDS.salaried;
  return ids.map((id) => getCategoryById(id));
}

export function getToolsForMode(mode) {
  const ids = MODE_TOOL_IDS[mode] || MODE_TOOL_IDS.salaried;
  const overrides = MODE_TOOL_TITLES[mode] || {};
  return ids.map((id) => {
    const base = MODE_TOOL_DEFS[id];
    if (!base) return null;
    return { ...base, ...(overrides[id] || {}) };
  }).filter(Boolean);
}

export function getDashboardToolsHeading(mode) {
  return MODE_DASHBOARD_TOOLS_HEADING[mode] || "Quick calculators";
}

export function showHomeRolePanel(mode) {
  return mode !== "salaried";
}

export function showSalariedStabilityCards(mode) {
  return mode === "salaried" || mode === "family" || mode === "power";
}
