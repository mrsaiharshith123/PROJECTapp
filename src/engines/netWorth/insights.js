/**
 * Emotionally intelligent insight composer for net worth module.
 * Returns insight objects with i18n keys — never raw English in engines for UI.
 */

/**
 * @param {object} ctx
 */
export function buildNetWorthInsights(ctx) {
  /** @type {{ id: string, tone: 'calm' | 'positive' | 'caution' | 'action', key: string, params?: Record<string, string|number> }[]} */
  const insights = [];

  const push = (id, tone, key, params) => {
    insights.push({ id, tone, key, params });
  };

  if (ctx.savingsStreakMonths >= 3) {
    push("savings-streak", "positive", "netWorth.insight.savingsStreak", {
      months: ctx.savingsStreakMonths,
    });
  }

  if (ctx.monthlyGrowthPct != null && ctx.monthlyGrowthPct > 2) {
    push("wealth-growing", "positive", "netWorth.insight.wealthGrowing", {
      pct: Math.round(ctx.monthlyGrowthPct * 10) / 10,
    });
  }

  if (ctx.liabilitiesGrowingFaster) {
    push("liab-faster", "caution", "netWorth.insight.liabilitiesFaster");
  }

  if (ctx.emergencyBelowRecommended) {
    push("emergency-low", "action", "netWorth.insight.emergencyLow");
  }

  if (ctx.flexibilityImproved) {
    push("flex-up", "positive", "netWorth.insight.flexibilityImproved");
  }

  if (ctx.debtHealth?.pressureLevel === "critical") {
    push("debt-critical", "caution", "netWorth.insight.debtCritical");
  }

  if (ctx.lifeScore?.band === "thriving") {
    push("life-thriving", "calm", "netWorth.insight.lifeThriving");
  }

  for (const k of ctx.liquidity?.insightKeys || []) {
    push(`liq-${k.key}`, "calm", k.key, k.params);
  }

  for (const k of ctx.debtHealth?.insightKeys || []) {
    push(`debt-${k.key}`, "action", k.key, k.params);
  }

  for (const k of ctx.pressure?.narrativeKeys || []) {
    push(`pres-${k.key}`, "calm", k.key, k.params);
  }

  const seen = new Set();
  return insights.filter((i) => {
    const sig = `${i.key}:${JSON.stringify(i.params || {})}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  }).slice(0, 8);
}
