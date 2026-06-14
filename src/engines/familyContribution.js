import { format, parseISO } from "date-fns";

/**
 * Contribution memory from bill payment history and payer tags (local, emotional ledger).
 * @param {object[]} commitments
 * @param {(c: object) => string} getEffectiveStatus
 * @param {string} [todayStr]
 */
export function buildFamilyContributionMemory(commitments, getEffectiveStatus, todayStr = "") {
  /** @type {Record<string, { total: number, months: Set<string>, categories: Set<string> }>} */
  const byPayer = { primary: { total: 0, months: new Set(), categories: new Set() }, secondary: { total: 0, months: new Set(), categories: new Set() }, shared: { total: 0, months: new Set(), categories: new Set() } };

  for (const c of commitments) {
    const payer = c.householdPayer === "secondary" ? "secondary" : c.householdPayer === "shared" ? "shared" : c.householdPayer === "primary" ? "primary" : null;
    if (!payer) continue;
    const payments = Array.isArray(c.payments) ? c.payments : [];
    for (const p of payments) {
      const amt = Math.max(0, Number(p.amount) || 0);
      if (amt <= 0 || !p.date) continue;
      byPayer[payer].total += amt;
      byPayer[payer].months.add(p.date.slice(0, 7));
      if (c.category) byPayer[payer].categories.add(c.category);
    }
  }

  const memories = [];
  for (const [key, bucket] of Object.entries(byPayer)) {
    if (bucket.total < 1000 || bucket.months.size < 2) continue;
    const monthCount = bucket.months.size;
    const topCats = [...bucket.categories].slice(0, 2).join(", ") || "household bills";
    memories.push({
      id: `family-contribution-${key}`,
      tone: monthCount >= 6 ? "positive" : "neutral",
      params: {
        months: monthCount,
        categories: topCats,
        amount: Math.round(bucket.total),
      },
    });
  }

  const pressureMonths = detectPressureSurvival(commitments, getEffectiveStatus, todayStr);
  if (pressureMonths.length >= 3) {
    memories.push({
      id: "family-contribution-survived-pressure",
      tone: "positive",
      params: { months: pressureMonths.length, period: pressureMonths[0]?.label || "" },
    });
  }

  return { memories: memories.slice(0, 5), byPayer };
}

function detectPressureSurvival(commitments, getEffectiveStatus, todayStr) {
  if (!todayStr) return [];
  /** @type {Record<string, { burden: number, paid: number }>} */
  const months = {};
  for (const c of commitments) {
    const payments = Array.isArray(c.payments) ? c.payments : [];
    for (const p of payments) {
      if (!p.date) continue;
      const key = p.date.slice(0, 7);
      if (!months[key]) months[key] = { burden: 0, paid: 0 };
      months[key].paid += Math.max(0, Number(p.amount) || 0);
    }
    if (getEffectiveStatus(c) !== "paid") {
      const due = c.dueDate?.slice(0, 7);
      if (due && months[due]) {
        months[due].burden += Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
      }
    }
  }

  return Object.entries(months)
    .filter(([, v]) => v.paid > 0 && v.burden > v.paid * 0.4)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([key]) => {
      try {
        return { key, label: format(parseISO(`${key}-01`), "MMM yyyy") };
      } catch {
        return { key, label: key };
      }
    });
}
