/** Curated tools surfaced on Home — ids match Plan tool panels. */
export const HOME_CALCULATOR_TOOLS = [
  { id: "tax", icon: "currency-inr", titleKey: "plan.tools.tax", subtitleKey: "plan.tools.taxSub" },
  { id: "loan", icon: "chart-line-down", titleKey: "plan.tools.loanPayoff", subtitleKey: "plan.tools.loanPayoffSub" },
  { id: "safety", icon: "shield", titleKey: "plan.tools.safety", subtitleKey: "plan.tools.safetySub" },
  { id: "expense", icon: "calculator", titleKey: "plan.tools.expense", subtitleKey: "plan.tools.expenseSub" },
];

export const HOME_GROWTH_TOOLS = [
  { id: "retirement", icon: "bank", titleKey: "tools.retirement.title", subtitleKey: "tools.retirement.subtitle" },
  { id: "invest", icon: "chart-line-up", titleKey: "plan.tools.sip", subtitleKey: "plan.tools.sipSub" },
  { id: "wealth", icon: "chart-bar", titleKey: "plan.tools.wealth", subtitleKey: "plan.tools.wealthSub" },
  { id: "bond", icon: "scroll", titleKey: "plan.tools.bond", subtitleKey: "plan.tools.bondSub" },
];

export function homeToolPath(id) {
  return `/you/tools?tool=${id}`;
}
