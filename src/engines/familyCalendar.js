import { addMonths, format, parseISO } from "date-fns";
const HEAVY_CATEGORIES = new Set(["School", "Insurance", "Rent", "Chit Fund"]);

/**
 * Upcoming months with clustered family bills (school, insurance, festivals via yearly dues).
 */
export function buildFamilyExpenseCalendar(commitments, todayStr, getEffectiveStatus, monthsAhead = 8) {
  const today = parseISO(`${todayStr}T12:00:00`);
  const buckets = {};

  for (let i = 0; i < monthsAhead; i++) {
    const key = format(addMonths(today, i), "yyyy-MM");
    buckets[key] = { monthKey: key, label: format(addMonths(today, i), "MMM yyyy"), amount: 0, items: [] };
  }

  for (const c of commitments) {
    if (getEffectiveStatus(c, todayStr) === "paid") continue;
    const due = c.dueDate || c.startDate;
    if (!due) continue;
    const key = due.slice(0, 7);
    if (!buckets[key]) continue;
    const amt = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
    buckets[key].amount += amt;
    buckets[key].items.push({
      name: c.name,
      category: c.category,
      amount: Math.round(amt),
      heavy: HEAVY_CATEGORIES.has(c.category),
    });
  }

  const rows = Object.values(buckets).filter((b) => b.amount > 0 || b.items.length > 0);
  const avg = rows.length ? rows.reduce((s, r) => s + r.amount, 0) / rows.length : 0;
  const heavyMonths = rows
    .filter((b) => b.amount >= avg * 1.35 && b.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const insights = [];
  if (heavyMonths[0]) {
    const top = heavyMonths[0];
    const cats = [...new Set(top.items.filter((i) => i.heavy).map((i) => i.category))];
    insights.push({
      id: "family-heavy-month",
      tone: cats.length ? "warning" : "info",
      params: {
        month: top.label,
        amount: Math.round(top.amount),
        categories: cats.length ? ` — ${cats.join(", ")}` : "",
      },
    });
  }

  return { months: rows, heavyMonths: heavyMonths.slice(0, 3), insights };
}
