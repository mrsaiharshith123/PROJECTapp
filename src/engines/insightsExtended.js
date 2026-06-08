import { differenceInCalendarDays, parseISO } from "date-fns";
import { buildCashflowForecastSeries } from "./forecastSeries.js";

/** Due dates clustering in the next 7 days. */
export function overlappingDueDatesInsight(commitments, lendings, todayStr, getEffectiveStatus, getEffectiveLendingStatus) {
  const items = [];
  for (const c of commitments) {
    if (getEffectiveStatus(c) === "paid" || !c.dueDate) continue;
    try {
      const d = parseISO(`${c.dueDate}T12:00:00`);
      const days = differenceInCalendarDays(d, parseISO(`${todayStr}T12:00:00`));
      if (days >= 0 && days <= 7) {
        items.push({ name: c.name, amount: Number(c.remainingAmount ?? c.amount) || 0, days });
      }
    } catch {
      /* skip */
    }
  }
  for (const l of lendings) {
    if (getEffectiveLendingStatus(l) === "complete" || !l.dueDate) continue;
    try {
      const d = parseISO(`${l.dueDate}T12:00:00`);
      const days = differenceInCalendarDays(d, parseISO(`${todayStr}T12:00:00`));
      if (days >= 0 && days <= 7) {
        items.push({ name: l.personName, amount: Number(l.remainingAmount) || 0, days, lending: true });
      }
    } catch {
      /* skip */
    }
  }
  if (items.length < 2) return null;
  const total = items.reduce((s, i) => s + i.amount, 0);
  return {
    id: "overlap-week",
    tone: "warning",
    params: { count: items.length, total: `₹${Math.round(total).toLocaleString()}` },
  };
}

/** Find month with lowest forecast free cash in next 12 months. */
export function forecastCrunchInsight(
  commitments,
  income,
  getEffectiveStatus,
  todayStr,
  /** @type {{ lendings?: object[], getEffectiveLendingStatus?: (l: object, todayStr?: string) => string }} */ { lendings = [], getEffectiveLendingStatus } = {}
) {
  const series = buildCashflowForecastSeries(commitments, income, getEffectiveStatus, todayStr, 12, {
    lendings,
    getEffectiveLendingStatus,
  });
  if (!series.length) return null;
  let worst = series[0];
  for (const row of series) {
    if (row.free < worst.free) worst = row;
  }
  if (worst.free >= income * 0.25 && worst.free >= 5000) return null;
  return worst.free < 0
    ? {
        id: "forecast-crunch-negative",
        tone: "critical",
        params: { month: worst.month },
      }
    : {
        id: "forecast-crunch-tight",
        tone: "warning",
        params: { month: worst.month, free: `₹${Math.round(worst.free).toLocaleString()}` },
      };
}

export function subscriptionYearlyCostInsight(commitments, getEffectiveStatus) {
  const monthly = commitments.reduce((s, c) => {
    if (c.category !== "Subscription" || getEffectiveStatus(c) === "paid") return s;
    if (c.repeatType === "monthly") return s + (Number(c.amount) || 0);
    if (c.repeatType === "yearly") return s + (Number(c.amount) || 0) / 12;
    return s;
  }, 0);
  if (monthly < 500) return null;
  const yearly = Math.round(monthly * 12);
  return {
    id: "subs-yearly",
    tone: "info",
    params: { amount: `₹${yearly.toLocaleString()}` },
  };
}

export function emiBurdenPercentInsight(commitments, income, getEffectiveStatus) {
  const inc = Math.max(0, income || 0);
  if (inc <= 0) return null;
  const emiMonthly = commitments.reduce((s, c) => {
    if (c.category !== "EMI" || getEffectiveStatus(c) === "paid") return s;
    if (c.repeatType === "monthly") return s + (Number(c.amount) || 0);
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
  if (emiMonthly <= 0) return null;
  const pct = Math.round((emiMonthly / inc) * 100);
  if (pct < 40) return null;
  return {
    id: "emi-pct",
    tone: pct >= 60 ? "critical" : "warning",
    params: { percent: pct },
  };
}

export function mergeExtendedInsights(base, extended) {
  const ids = new Set(base.map((i) => i.id));
  const merged = [...base];
  for (const ins of extended) {
    if (ins && !ids.has(ins.id)) merged.push(ins);
  }
  return merged.slice(0, 10);
}
