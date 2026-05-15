import { addMonths, format, parseISO } from "date-fns";
import { getEffectiveStatus } from "../utils/commitmentStatus.js";

/**
 * Estimate next calendar month total scheduled outflow (rough).
 */
export function forecastNextMonthBurden(commitments, todayStr) {
  const today = parseISO(`${todayStr}T12:00:00`);
  const nextMonthKey = format(addMonths(today, 1), "yyyy-MM");
  const nextMonthNum = format(addMonths(today, 1), "MM");
  let total = 0;
  const names = [];

  for (const c of commitments) {
    const eff = getEffectiveStatus(c, todayStr);
    if (eff === "paid") continue;
    const amt = Number(c.amount) || 0;
    const rt = c.repeatType || "none";
    if (rt === "monthly") {
      total += amt;
      names.push(c.name);
    } else if (rt === "yearly") {
      const due = c.dueDate || "";
      if (due.slice(5, 7) === nextMonthNum) {
        total += amt;
        names.push(c.name);
      }
    } else {
      const due = c.dueDate || "";
      if (due.startsWith(nextMonthKey)) {
        total += Math.max(0, Number(c.remainingAmount ?? amt));
        names.push(c.name);
      }
    }
  }

  return { total, itemNames: names, nextMonthKey };
}

export function detectLargeOverlaps(commitments, todayStr, thresholdMultiple = 1.35) {
  const { total } = forecastNextMonthBurden(commitments, todayStr);
  const current = commitments.reduce((s, c) => {
    if (getEffectiveStatus(c, todayStr) === "paid") return s;
    const amt = Number(c.amount) || 0;
    if ((c.repeatType || "none") === "monthly") return s + amt;
    return s;
  }, 0);
  if (current <= 0 || total < current * thresholdMultiple) return null;
  return {
    message: `Next month obligations look heavier than typical recurring load (≈₹${Math.round(total).toLocaleString()} vs ₹${Math.round(current).toLocaleString()}).`,
  };
}

export function forecastInsights(commitments, todayStr) {
  const out = [];
  const { total, itemNames } = forecastNextMonthBurden(commitments, todayStr);
  const currentMonthBurden = commitments.reduce((s, c) => {
    if (getEffectiveStatus(c, todayStr) === "paid") return s;
    const amt = Number(c.amount) || 0;
    if ((c.repeatType || "none") === "monthly") return s + amt;
    return s;
  }, 0);
  const delta = total - currentMonthBurden;
  if (delta > 3000) {
    out.push({
      id: "next-month-up",
      text: `Next month obligations may increase by about ₹${Math.round(delta).toLocaleString()} (renewals / one-offs in that month).`,
    });
  }
  if (itemNames.length >= 3 && total > 0) {
    out.push({
      id: "overlap",
      text: `${itemNames.length} sizeable items cluster next month—prepare cash flow early.`,
    });
  }
  const overlap = detectLargeOverlaps(commitments, todayStr);
  if (overlap) out.push({ id: "overlap-heavy", text: overlap.message });
  return out.slice(0, 4);
}
