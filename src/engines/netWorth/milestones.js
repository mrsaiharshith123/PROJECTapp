/**
 * Subtle gamification — premium milestone detection.
 */

/**
 * @param {object} state
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthMilestone[]} existing
 */
export function detectNewMilestones(state, existing) {
  const ids = new Set(existing.map((m) => m.id));
  /** @type {import('../../utils/netWorth/wealthStorage.js').WealthMilestone[]} */
  const fresh = [];
  const now = Date.now();
  const { netWorth, totalDebt, liquidNetWorth, savingsStreakMonths } = state;

  const add = (id, type, labelKey, value) => {
    if (ids.has(id)) return;
    fresh.push({ id, type, labelKey, achievedAt: now, value });
    ids.add(id);
  };

  if (netWorth >= 100000) add("nw-1l", "wealth", "netWorth.milestone.1L", netWorth);
  if (netWorth >= 500000) add("nw-5l", "wealth", "netWorth.milestone.5L", netWorth);
  if (netWorth >= 1000000) add("nw-10l", "wealth", "netWorth.milestone.10L", netWorth);
  if (liquidNetWorth >= 100000) add("liq-1l", "liquidity", "netWorth.milestone.liquid1L", liquidNetWorth);
  if (totalDebt === 0 && netWorth > 0) add("debt-free", "debt", "netWorth.milestone.debtFree", 0);
  if (savingsStreakMonths >= 6) add("streak-6", "streak", "netWorth.milestone.streak6", savingsStreakMonths);
  if (savingsStreakMonths >= 12) add("streak-12", "streak", "netWorth.milestone.streak12", savingsStreakMonths);

  return fresh;
}
