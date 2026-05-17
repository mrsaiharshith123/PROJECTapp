import { format } from "date-fns";
import { totalMonthlyBurden } from "./burden.js";
import { normalizeRepeatType, repeatIntervalMonths } from "../constants/repeatTypes.js";

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
    insights.push({
      id: "free-cash-low",
      tone: "warning",
      text: `Your free cash after typical monthly burden may be tight (obligations use a large share of income).`,
    });
  }

  if (ratio != null && ratio > 0.75) {
    insights.push({
      id: "burden-danger",
      tone: "critical",
      text: "EMI-style burden crossed a dangerous range vs income. Pause new bills if possible.",
    });
  } else if (ratio != null && ratio > 0.6) {
    insights.push({
      id: "burden-risk",
      tone: "warning",
      text: "Monthly bill burden is elevated vs income—worth re-checking discretionary spends.",
    });
  }

  const subs = sumCategoryMonthly(commitments, getEffectiveStatus, "Subscription");
  if (subs >= 1500) {
    insights.push({
      id: "subs-weight",
      tone: "info",
      text: `Subscriptions add roughly ₹${Math.round(subs).toLocaleString()}/mo to your baseline—small leaks compound.`,
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
        text: `Open bill balance jumped vs last snapshot (${prev.month} → ${last.month}).`,
      });
    }
    if (last.openRemainingSum < prev.openRemainingSum * 0.92) {
      insights.push({
        id: "pressure-down",
        tone: "positive",
        text: "You reduced open bill pressure compared to the prior month snapshot.",
      });
    }
  }

  const overdueCount = commitments.filter((c) => getEffectiveStatus(c) === "overdue").length;
  if (overdueCount >= 2) {
    insights.push({
      id: "multi-overdue",
      tone: "critical",
      text: `${overdueCount} items are overdue—clearing them first usually lowers stress fastest.`,
    });
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
      text: `You recorded ₹${Math.round(paidThisMonth).toLocaleString()} in payments this month—consistency builds runway.`,
    });
  }

  return insights.slice(0, 8);
}
