import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { totalMonthlyBurden } from "./burden.js";
import { normalizeRepeatType, repeatIntervalMonths } from "../constants/repeatTypes.js";
import { buildCashflowForecastSeries } from "./forecastSeries.js";

function sumOpenRemaining(commitments, getEffectiveStatusFn) {
  return commitments.reduce((s, c) => {
    if (getEffectiveStatusFn(c) === "paid") return s;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
}

function sumCategoryMonthly(commitments, getEffectiveStatusFn, categoryId) {
  return commitments.reduce((s, c) => {
    if (c.category !== categoryId) return s;
    if (getEffectiveStatusFn(c) === "paid") return s;
    const amt = Number(c.amount) || 0;
    const interval = repeatIntervalMonths(normalizeRepeatType(c.repeatType));
    if (interval > 0) return s + amt / interval;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
}

/**
 * @param {object} ctx
 * @param {object[]} ctx.commitments
 * @param {object[]} ctx.snapshots newest last
 * @param {number} ctx.income
 * @param {function} ctx.getEffectiveStatus
 */
export function generateCommitmentInsights(ctx) {
  const { commitments, snapshots, income, getEffectiveStatus } = ctx;
  const insights = [];
  const inc = Math.max(0, income || 0);
  const open = sumOpenRemaining(commitments, getEffectiveStatus);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const ratio = inc > 0 ? burden / inc : null;

  if (inc > 0 && open < 10000 && burden / inc > 0.5) {
    insights.push({ id: "free-cash-low", tone: "warning" });
  }

  if (ratio != null && ratio > 0.75) {
    insights.push({ id: "burden-danger", tone: "critical" });
  } else if (ratio != null && ratio > 0.6) {
    insights.push({ id: "burden-risk", tone: "warning" });
  }

  const subs = sumCategoryMonthly(commitments, getEffectiveStatus, "Subscription");
  if (subs >= 1500) {
    insights.push({
      id: "subs-weight",
      tone: "info",
      params: { amount: `₹${Math.round(subs).toLocaleString()}` },
    });
  }

  const sorted = [...(snapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
  if (sorted.length >= 2) {
    const prev = sorted[sorted.length - 2];
    const last = sorted[sorted.length - 1];
    if (prev.openRemainingSum > 0 && last.openRemainingSum > prev.openRemainingSum * 1.15) {
      insights.push({
        id: "open-up",
        tone: "warning",
        params: { fromMonth: prev.month, toMonth: last.month },
      });
    }
    if (last.openRemainingSum < prev.openRemainingSum * 0.92) {
      insights.push({ id: "pressure-down", tone: "positive" });
    }
  }

  const overdueCount = commitments.filter((c) => getEffectiveStatus(c) === "overdue").length;
  if (overdueCount >= 2) {
    insights.push({ id: "multi-overdue", tone: "critical", params: { count: overdueCount } });
  }

  const thisMonth = format(new Date(), "yyyy-MM");
  let paidThisMonth = 0;
  for (const c of commitments) {
    for (const p of c.payments || []) {
      if ((p.date || "").startsWith(thisMonth)) paidThisMonth += Number(p.amount) || 0;
    }
  }
  if (paidThisMonth > 0) {
    insights.push({
      id: "paying-habit",
      tone: "positive",
      params: { amount: `₹${Math.round(paidThisMonth).toLocaleString()}` },
    });
  }

  return insights.slice(0, 8);
}

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
  /** @type {{ lendings?: object[], getEffectiveLendingStatus?: (l: object, todayStr?: string) => string }} */ { lendings = [], getEffectiveLendingStatus } = {},
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
