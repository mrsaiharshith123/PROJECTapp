/**
 * Resolve engine insight copy through i18n keys (`insight.{id}`).
 * @param {(key: string, params?: object) => string} t
 * @param {{ id?: string, key?: string, text?: string, params?: object } | null | undefined} insight
 */
export function translateInsight(t, insight) {
  if (!insight) return "";
  if (insight.key) return t(insight.key, insight.params || {});
  const id = insight.id;
  if (id) {
    const msgKey = `insight.${id}`;
    const translated = t(msgKey, insight.params || {});
    if (translated !== msgKey) return translated;
  }
  return insight.text || "";
}

const EXPLAIN_RULES = [
  { match: /overdue|past due/i, keys: ["guidance.explain.overdue1"] },
  {
    match: /subscription|sub-/i,
    keys: ["guidance.explain.subscription1", "guidance.explain.subscription2"],
  },
  { match: /emi|loan|debt/i, keys: ["guidance.explain.emi1"] },
  { match: /emergency|reserve|savings/i, keys: ["guidance.explain.emergency1"] },
  { match: /school|education|household|family/i, keys: ["guidance.explain.household1"] },
  {
    match: /volatil|income|revenue/i,
    keys: ["guidance.explain.income1", "guidance.explain.income2"],
  },
  { match: /goal/i, keys: ["guidance.explain.goal1"] },
  {
    match: /txn-|delivery|restaurant|lifestyle leak|discretionary/i,
    keys: ["guidance.explain.txn1", "guidance.explain.txn2"],
  },
  { match: /medical|health/i, keys: ["guidance.explain.health1"] },
  { match: /pressure|burden|committed/i, keys: ["guidance.explain.pressure1"] },
];

/**
 * @param {(key: string, params?: object) => string} t
 * @param {{ id?: string, text?: string, tone?: string }} insight
 * @param {{ mode?: string, stressTop?: Array<{ name?: string, category?: string }>, overdueCount?: number }} ctx
 */
export function explainInsightI18n(t, insight, ctx = {}) {
  const id = insight?.id || "";
  const reasons = [];

  for (const rule of EXPLAIN_RULES) {
    if (rule.match.test(id) || rule.match.test(insight?.text || "")) {
      for (const key of rule.keys) reasons.push(t(key));
    }
  }

  if (ctx.overdueCount > 0 && !reasons.some((r) => /past|గడువు|अतिदेय|காலாவதி/i.test(r))) {
    reasons.push(t("guidance.explain.overdueCount", { count: ctx.overdueCount }));
  }

  if (ctx.stressTop?.length) {
    const top = ctx.stressTop
      .slice(0, 2)
      .map((s) => s.name || s.category)
      .filter(Boolean);
    if (top.length) {
      reasons.push(t("guidance.explain.stressDrivers", { names: top.join(t("guidance.explain.and")) }));
    }
  }

  const unique = [...new Set(reasons)].slice(0, 4);
  if (unique.length === 0) {
    unique.push(t("guidance.explain.fallback"));
  }

  return {
    headline: translateInsight(t, insight) || t("guidance.explain.headlineFallback"),
    reasons: unique,
    mode: ctx.mode,
  };
}
