/**
 * "1 year ago today, you bought X for ₹Y — it's now worth ₹Z." Cheap:
 * pure date matching on purchaseYear/purchaseMonth fields already stored.
 * Without a stored purchase day, this fires for the whole purchase month
 * (not a false-precise single day) so it reads as a genuine anniversary
 * moment rather than a recurring nag the rest of the year.
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} entries
 * @param {Date} [now]
 */
export function findAnniversaryReflections(entries, now = new Date()) {
  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();

  const results = [];
  for (const e of entries || []) {
    if (e.hidden || !e.purchaseYear) continue;
    const purchaseMonth = Number(e.purchaseMonth) || 1;
    if (nowMonth !== purchaseMonth) continue;

    const yearsAgo = nowYear - Number(e.purchaseYear);
    if (yearsAgo <= 0) continue;

    const purchaseValue = Number(e.purchasePrice) || null;
    const currentValue = Math.max(0, Number(e.value) || 0);
    const growth = purchaseValue != null && purchaseValue > 0 ? currentValue - purchaseValue : null;

    results.push({
      id: e.id,
      name: e.name,
      categoryId: e.categoryId,
      yearsAgo,
      purchaseValue,
      currentValue,
      growth,
      growthPct: growth != null && purchaseValue > 0 ? Math.round((growth / purchaseValue) * 1000) / 10 : null,
    });
  }

  return results.sort((a, b) => b.yearsAgo - a.yearsAgo);
}
