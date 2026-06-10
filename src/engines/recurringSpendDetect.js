/**
 * Detect recurring merchants from manually logged daily spends.
 */

function normalizeMerchant(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

const CATEGORY_HINTS = [
  { re: /swiggy|zomato|blinkit|zepto|dunzo/i, category: "Subscription" },
  { re: /netflix|spotify|prime|hotstar|youtube/i, category: "Subscription" },
  { re: /petrol|fuel|uber|ola|rapido/i, category: "Other" },
];

function guessCategory(merchant) {
  for (const h of CATEGORY_HINTS) {
    if (h.re.test(merchant)) return h.category;
  }
  return "Subscription";
}

/**
 * @param {object[]} dailySpends
 * @param {{ monthKey?: string, minOccurrences?: number, todayStr?: string }} [options]
 */
export function detectRecurringFromDailySpends(dailySpends, options = {}) {
  const minOccurrences = options.minOccurrences ?? 3;
  const monthKey = options.monthKey;
  /** @type {Map<string, { merchant: string, amounts: number[], dates: string[] }>} */
  const map = new Map();

  for (const s of dailySpends || []) {
    const date = String(s.date || "");
    if (monthKey && !date.startsWith(monthKey)) continue;
    const merchant = normalizeMerchant(s.merchant || s.note || s.label || s.category);
    if (!merchant || merchant.length < 3) continue;
    if (!map.has(merchant)) {
      map.set(merchant, { merchant: s.merchant || s.note || s.label || merchant, amounts: [], dates: [] });
    }
    const row = map.get(merchant);
    row.amounts.push(Math.max(0, Number(s.amount) || 0));
    row.dates.push(date);
  }

  return [...map.values()]
    .filter((e) => e.dates.length >= minOccurrences)
    .map((e) => {
      const avg = Math.round(e.amounts.reduce((a, b) => a + b, 0) / e.amounts.length);
      const lastDate = e.dates.sort().pop();
      return {
        name: String(e.merchant).slice(0, 48),
        category: guessCategory(e.merchant),
        suggestedAmount: avg,
        occurrences: e.dates.length,
        lastDate,
        insightId: "recurring-spend-suggest",
        params: { name: String(e.merchant).slice(0, 32), count: e.dates.length, amount: avg },
      };
    })
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 8);
}

/**
 * @param {ReturnType<typeof detectRecurringFromDailySpends>} recurring
 */
export function recurringSpendToBillDraft(recurring) {
  return (recurring || []).map((r) => ({
    name: r.name,
    amount: r.suggestedAmount,
    dueDate: r.lastDate,
    category: r.category,
    repeatType: "monthly",
    priority: "normal",
    notes: `Suggested from ${r.occurrences} logged spends`,
  }));
}
