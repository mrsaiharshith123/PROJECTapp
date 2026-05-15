import { format, subMonths, parseISO, differenceInCalendarDays } from "date-fns";
import { totalMonthlyBurden } from "./burden.js";

export function snapshotsToPressureTrend(snapshots, months = 8) {
  const keys = [];
  for (let i = months - 1; i >= 0; i--) {
    keys.push(format(subMonths(new Date(), i), "yyyy-MM"));
  }
  const byMonth = Object.fromEntries((snapshots || []).map((s) => [s.month, s]));
  return keys.map((k) => ({
    month: k.slice(5),
    pressure: byMonth[k]?.pressureScore ?? 0,
    openRemaining: byMonth[k]?.openRemainingSum ?? null,
    freeMoney: byMonth[k]?.freeMoney ?? null,
  }));
}

export function categoryOpenTrend(commitments, getEffectiveStatusFn, categoryId) {
  return commitments
    .filter((c) => c.category === categoryId && getEffectiveStatusFn(c) !== "paid")
    .reduce((s, c) => s + Math.max(0, Number(c.remainingAmount ?? 0)), 0);
}

export function recurringGrowthSeries(commitments, getEffectiveStatusFn, months = 8) {
  const rows = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const key = format(d, "yyyy-MM");
    let recurringPaid = 0;
    for (const c of commitments) {
      if (!c.repeatType || c.repeatType === "none") continue;
      for (const p of c.payments || []) {
        if ((p.date || "").startsWith(key)) recurringPaid += Number(p.amount) || 0;
      }
    }
    rows.push({ month: format(d, "MMM"), recurringPaid });
  }
  return rows;
}

export function debtReductionFromSnapshots(snapshots) {
  const sorted = [...(snapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
  if (sorted.length < 2) return null;
  const a = sorted[sorted.length - 2];
  const b = sorted[sorted.length - 1];
  const delta = a.openRemainingSum - b.openRemainingSum;
  return { fromMonth: a.month, toMonth: b.month, openDelta: delta };
}

export function freeCashflowTrend(snapshots, months = 8) {
  const sorted = [...(snapshots || [])].sort((a, b) => a.month.localeCompare(b.month)).slice(-months);
  return sorted.map((s) => ({
    month: s.month.slice(5),
    freeMoney: s.freeMoney,
    burden: s.monthlyBurden ?? 0,
  }));
}

export function yearlyBurdenFromCommitments(commitments, getEffectiveStatusFn) {
  return totalMonthlyBurden(commitments, getEffectiveStatusFn) * 12;
}

/** Next 28 days: count and amount due per day bucket (week index). */
export function buildDueHeatmap(commitments, lendings, todayStr, getEffectiveStatus, getEffectiveLendingStatus) {
  const start = parseISO(`${todayStr}T12:00:00`);
  const buckets = Array.from({ length: 4 }, (_, i) => ({
    label: i === 0 ? "This week" : `+${i} wk`,
    count: 0,
    amount: 0,
  }));

  const addItem = (dueDate, amount) => {
    try {
      const d = parseISO(`${dueDate}T12:00:00`);
      const dayOffset = differenceInCalendarDays(d, start);
      if (dayOffset < 0 || dayOffset > 27) return;
      const week = Math.min(3, Math.floor(dayOffset / 7));
      buckets[week].count += 1;
      buckets[week].amount += amount;
    } catch {
      /* skip */
    }
  };

  for (const c of commitments) {
    if (getEffectiveStatus(c) === "paid") continue;
    addItem(c.dueDate, Number(c.remainingAmount ?? c.amount) || 0);
  }
  for (const l of lendings) {
    if (getEffectiveLendingStatus(l) === "complete") continue;
    addItem(l.dueDate, Number(l.remainingAmount) || 0);
  }

  return buckets;
}

/** Principal vs interest paid across lending payment history. */
export function lendingPrincipalInterestTotals(lendings) {
  let principal = 0;
  let interest = 0;
  for (const l of lendings) {
    for (const p of l.payments || []) {
      principal += Number(p.principalPortion) || Number(p.amount) || 0;
      interest += Number(p.interestPortion) || 0;
    }
  }
  if (principal === 0 && interest === 0) {
    const paid = lendings.reduce(
      (s, l) => s + (l.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0),
      0
    );
    return { principal: paid, interest: 0, total: paid };
  }
  return { principal, interest, total: principal + interest };
}

export function lendingCompletionStats(lendings, getEffectiveLendingStatus) {
  let active = 0;
  let settled = 0;
  let overdue = 0;
  for (const l of lendings) {
    const rem = Number(l.remainingBalance ?? l.remainingAmount) || 0;
    const status = getEffectiveLendingStatus ? getEffectiveLendingStatus(l) : l.status;
    if (rem <= 0) settled += 1;
    else {
      active += 1;
      if (status === "overdue") overdue += 1;
    }
  }
  return { active, settled, overdue, total: lendings.length };
}
