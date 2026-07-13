/**
 * Groups liabilities/commitments by an optional `lifeEventTag` (e.g.
 * "wedding") so a big one-off life event's debt can be tracked and paid
 * down as its own named thing, separate from the emotional weight of
 * calling it out by name everywhere if the user prefers a neutral label.
 * @param {object[]} commitments
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} [liabilities]
 */
export function summarizeLifeEventDebt(commitments, liabilities = []) {
  /** @type {Map<string, { tag: string, totalOutstanding: number, items: { id: string, name: string, remaining: number, source: 'bill'|'liability' }[] }>} */
  const groups = new Map();

  for (const c of commitments || []) {
    if (!c.lifeEventTag) continue;
    const remaining = Math.max(0, Number(c.remainingAmount) || 0);
    if (!groups.has(c.lifeEventTag)) groups.set(c.lifeEventTag, { tag: c.lifeEventTag, totalOutstanding: 0, items: [] });
    const g = groups.get(c.lifeEventTag);
    g.totalOutstanding += remaining;
    g.items.push({ id: c.id, name: c.name, remaining, source: "bill" });
  }

  for (const l of liabilities || []) {
    if (!l.lifeEventTag || l.hidden) continue;
    const remaining = Math.max(0, Number(l.value) || 0);
    if (!groups.has(l.lifeEventTag)) groups.set(l.lifeEventTag, { tag: l.lifeEventTag, totalOutstanding: 0, items: [] });
    const g = groups.get(l.lifeEventTag);
    g.totalOutstanding += remaining;
    g.items.push({ id: l.id, name: l.name, remaining, source: "liability" });
  }

  return [...groups.values()].sort((a, b) => b.totalOutstanding - a.totalOutstanding);
}
