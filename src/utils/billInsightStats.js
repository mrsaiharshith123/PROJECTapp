/**
 * @param {object[]} commitments
 * @param {(c: object) => string} getEffectiveStatus
 */
export function computeBiggestOpenCategory(commitments, getEffectiveStatus) {
  const map = {};
  for (const c of commitments || []) {
    if (getEffectiveStatus(c) === "paid") continue;
    const cat = c.category || "Other";
    map[cat] = (map[cat] || 0) + Math.max(0, Number(c.remainingAmount ?? 0));
  }
  const top = Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)[0];
  return top || null;
}

/** @param {object[]} commitments */
export function computeHighestRecurring(commitments) {
  let best = null;
  for (const c of commitments || []) {
    if (!c.repeatType || c.repeatType === "none") continue;
    const amt = Number(c.amount) || 0;
    if (!best || amt > best.amount) {
      best = { name: c.name, amount: amt, repeatType: c.repeatType };
    }
  }
  return best;
}
