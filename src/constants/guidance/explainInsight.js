/**
 * "Why am I seeing this?" — maps insight ids to human reasons.
 * @param {{ id?: string, text?: string, tone?: string }} insight
 * @param {{ mode?: string, stressTop?: Array<{ name?: string, category?: string }>, overdueCount?: number }} ctx
 */
export function explainInsight(insight, ctx = {}) {
  const id = insight?.id || "";
  const reasons = [];

  const rules = [
    {
      match: /overdue|past due/i,
      reasons: ["One or more bills are past their due date."],
    },
    {
      match: /subscription|sub-/i,
      reasons: ["Recurring subscriptions add to monthly burden.", "Optional recurring expenses accumulate gradually over time."],
    },
    {
      match: /emi|loan|debt/i,
      reasons: ["Fixed loan EMIs consume a steady slice of income."],
    },
    {
      match: /emergency|reserve|savings/i,
      reasons: ["Emergency savings are lower than typical monthly burn."],
    },
    {
      match: /school|education|rent/i,
      reasons: ["Fixed obligations such as school or rent weigh on monthly income."],
    },
    {
      match: /volatil|income|revenue/i,
      reasons: ["Income has varied across recent months.", "Uneven months make planning harder than average income suggests."],
    },
    {
      match: /goal/i,
      reasons: ["Active savings goals need monthly room in free cash."],
    },
    {
      match: /txn-|delivery|restaurant|lifestyle leak|discretionary/i,
      reasons: ["Daily spends and merchant patterns feed this signal.", "Small recurring purchases can reduce monthly flexibility."],
    },
    {
      match: /medical|health/i,
      reasons: ["Health-related spends are survival-category and can spike in tight months."],
    },
    {
      match: /pressure|burden|committed/i,
      reasons: ["Monthly obligations grew relative to income."],
    },
  ];

  for (const rule of rules) {
    if (rule.match.test(id) || rule.match.test(insight?.text || "")) {
      reasons.push(...rule.reasons);
    }
  }

  if (ctx.overdueCount > 0 && !reasons.some((r) => r.includes("past"))) {
    reasons.push(`${ctx.overdueCount} overdue bill(s) are flagged.`);
  }

  if (ctx.stressTop?.length) {
    const top = ctx.stressTop.slice(0, 2).map((s) => s.name || s.category).filter(Boolean);
    if (top.length) reasons.push(`Largest drivers include ${top.join(" and ")}.`);
  }

  const unique = [...new Set(reasons)].slice(0, 4);
  if (unique.length === 0) {
    unique.push("Perovo noticed a change in your bills, income, or savings inputs.");
  }

  return {
    headline: insight?.text || "This insight reflects your latest bills and income.",
    reasons: unique,
    mode: ctx.mode,
  };
}
