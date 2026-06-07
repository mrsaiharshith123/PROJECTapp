import { parseISO, differenceInCalendarDays } from "date-fns";
import { buildDueHeatmap } from "./analyticsSeries.js";
import { buildCashflowForecastSeries } from "./forecastSeries.js";
import { buildFamilyExpenseCalendar } from "./familyCalendar.js";
import { analyzeGoalBalance } from "./goalBalance.js";
import { freeMoneyAfterBurden } from "./pressureScore.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import { goalTypeLabel } from "./goalsProgress.js";

function enrichDueWeeks(buckets, commitments, lendings, todayStr, getEffectiveStatus, getEffectiveLendingStatus) {
  const start = parseISO(`${todayStr}T12:00:00`);
  const items = [];

  const push = (dueDate, amount, name, kind) => {
    try {
      const d = parseISO(`${dueDate}T12:00:00`);
      const offset = differenceInCalendarDays(d, start);
      if (offset < 0 || offset > 27) return;
      const week = Math.min(3, Math.floor(offset / 7));
      items.push({ dueDate, amount, name, kind, week, daysUntil: offset });
    } catch {
      /* skip */
    }
  };

  for (const c of commitments) {
    if (getEffectiveStatus(c, todayStr) === "paid") continue;
    push(c.dueDate, Number(c.remainingAmount ?? c.amount) || 0, c.name, c.category);
  }
  for (const l of lendings) {
    if (getEffectiveLendingStatus(l, todayStr) === "complete") continue;
    push(l.dueDate, Number(l.remainingAmount) || 0, l.personName || "Lending", "Lending");
  }

  return buckets.map((b, i) => ({
    ...b,
    items: items.filter((x) => x.week === i).sort((a, b) => a.daysUntil - b.daysUntil),
  }));
}

function annotateForecastMonths(rows) {
  if (!rows.length) return { rows, heavyMonths: [], lightest: null };
  const avgDue = rows.reduce((s, r) => s + r.due, 0) / rows.length;
  const heavyMonths = rows.filter((r) => r.due >= avgDue * 1.25 && r.due > 0);
  const lightest = [...rows].sort((a, b) => a.free - b.free)[0];
  return { rows, heavyMonths, lightest, avgDue: Math.round(avgDue) };
}

/** Monthly savings needed for amount-type goals. */
export function goalMonthlyCapacity(goals, freeMoney, todayStr) {
  const active = (goals || []).filter((g) => g.active !== false && !g.archived);
  return active.map((g) => {
    const target = Math.max(0, Number(g.targetAmount) || 0);
    const saved = Math.max(0, Number(g.savedAmount) || 0);
    const remaining = Math.max(0, target - saved);
    let monthsLeft = 12;
    if (g.targetDate) {
      try {
        const d = differenceInCalendarDays(parseISO(`${g.targetDate}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
        monthsLeft = Math.max(1, Math.ceil(d / 30));
      } catch {
        /* default */
      }
    }
    const neededPerMonth = remaining > 0 ? Math.ceil(remaining / monthsLeft) : 0;
    const feasible = neededPerMonth <= Math.max(0, freeMoney * 0.4);
    return {
      id: g.id,
      name: g.title || goalTypeLabel(g.type),
      type: g.type,
      neededPerMonth,
      remaining,
      feasible,
      monthsLeft,
    };
  });
}

/** When free cash is tight, suggest pay order. */
export function suggestBillPriority(commitments, getEffectiveStatus, todayStr, freeMoney) {
  const cash = Math.max(0, freeMoney);
  const open = commitments
    .filter((c) => {
      const st = getEffectiveStatus(c, todayStr);
      return st === "overdue" || st === "pending";
    })
    .map((c) => {
      const st = getEffectiveStatus(c, todayStr);
      const amt = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
      let score = st === "overdue" ? 100 : 0;
      if (c.priority === "critical") score += 40;
      if (c.category === "Rent" || c.category === "EMI" || c.category === "Loan") score += 25;
      if (c.category === "Insurance" || c.category === "School") score += 20;
      try {
        const days = differenceInCalendarDays(parseISO(`${c.dueDate}T12:00:00`), parseISO(`${todayStr}T12:00:00`));
        if (days >= 0 && days <= 7) score += 15;
      } catch {
        /* ignore */
      }
      return { id: c.id, name: c.name, category: c.category, amount: amt, score, status: st };
    })
    .sort((a, b) => b.score - a.score);

  let running = cash;
  const plan = [];
  for (const row of open) {
    const canPay = running >= row.amount;
    plan.push({ ...row, canPay, payNow: canPay });
    if (canPay) running -= row.amount;
  }
  const shortfall = open.reduce((s, r) => s + r.amount, 0) - cash;
  return {
    plan: plan.slice(0, 8),
    shortfall: Math.max(0, Math.round(shortfall)),
    coversAll: shortfall <= 0,
  };
}

/** Credit card treated as revolving debt pressure. */
export function analyzeCreditCardPressure(commitments, getEffectiveStatus, income) {
  const cards = commitments.filter(
    (c) => c.category === "Credit Card" && getEffectiveStatus(c) !== "paid"
  );
  if (cards.length === 0) return null;

  const open = cards.reduce((s, c) => s + Math.max(0, Number(c.remainingAmount ?? c.amount) || 0), 0);
  const minimum = cards.reduce((s, c) => s + Math.max(0, Number(c.amount) || 0), 0);
  const inc = Math.max(0, income || 0);
  const insights = [];
  if (open > minimum * 1.5) {
    insights.push("Card balance is well above the minimum due — interest cost may be high if you only pay minimum.");
  }
  if (inc > 0 && open / inc > 0.25) {
    insights.push(`Card balances are about ${Math.round((open / inc) * 100)}% of monthly income — treat as priority debt.`);
  }
  return {
    openBalance: Math.round(open),
    minimumDue: Math.round(minimum),
    count: cards.length,
    insights,
  };
}

/**
 * Unified ahead-looking plan (forecast + calendar + weeks) — single source for Home UI.
 */
export function buildStabilityAheadPlan({
  commitments,
  lendings,
  goals,
  settings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
  mode = "salaried",
}) {
  const income = combinedMonthlyIncome(settings);
  const cash = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);

  const dueWeeks = enrichDueWeeks(
    buildDueHeatmap(commitments, lendings, todayStr, getEffectiveStatus, getEffectiveLendingStatus),
    commitments,
    lendings,
    todayStr,
    getEffectiveStatus,
    getEffectiveLendingStatus
  );

  const forecastRaw = buildCashflowForecastSeries(
    commitments,
    income,
    getEffectiveStatus,
    todayStr,
    12,
    { lendings, getEffectiveLendingStatus }
  );
  const { rows: forecastMonths, heavyMonths, lightest, avgDue } = annotateForecastMonths(forecastRaw);

  const familyCalendar =
    mode === "family"
      ? buildFamilyExpenseCalendar(commitments, todayStr, getEffectiveStatus)
      : null;

  const mergedHeavy = [...heavyMonths];
  if (familyCalendar?.heavyMonths) {
    for (const fm of familyCalendar.heavyMonths) {
      if (!mergedHeavy.some((h) => h.monthKey === fm.monthKey)) {
        mergedHeavy.push({ month: fm.label, monthKey: fm.monthKey, due: fm.amount, free: 0, source: "household" });
      }
    }
  }

  const goalBalance = analyzeGoalBalance(goals, {
    burdenRatio: income > 0 ? cash.monthlyBurden / income : 0,
    freeMoney: cash.freeMoney,
    openRemainingSum: cash.openRemaining,
  });

  const goalCapacity = goalMonthlyCapacity(goals, cash.freeMoney, todayStr);
  const infeasibleGoals = goalCapacity.filter((g) => !g.feasible && g.neededPerMonth > 0);

  const billPriority =
    cash.freeMoney < cash.monthlyBurden * 0.15
      ? suggestBillPriority(commitments, getEffectiveStatus, todayStr, cash.freeMoney)
      : null;

  const creditCard = analyzeCreditCardPressure(commitments, getEffectiveStatus, income);

  const headlines = [];
  if (mergedHeavy[0]) {
    headlines.push({
      id: "heavy-month",
      tone: "warning",
      text: `${mergedHeavy[0].month} has the highest obligations (~₹${mergedHeavy[0].due.toLocaleString("en-IN")} due).`,
    });
  }
  if (lightest && lightest.free > 0) {
    headlines.push({
      id: "light-month",
      tone: "positive",
      text: `${lightest.month} has the most room (~₹${lightest.free.toLocaleString("en-IN")} free after dues).`,
    });
  }
  if (infeasibleGoals.length > 0) {
    headlines.push({
      id: "goal-capacity",
      tone: "warning",
      text: `${infeasibleGoals[0].name} needs ~₹${infeasibleGoals[0].neededPerMonth.toLocaleString("en-IN")}/mo — exceeds current free cash.`,
    });
  }
  const eduGoal = goalCapacity.find((g) => g.type === "education" && g.neededPerMonth > 0);
  if (eduGoal) {
    headlines.push({
      id: "education-timeline",
      tone: "info",
      text: `${eduGoal.name}: ~₹${eduGoal.neededPerMonth.toLocaleString("en-IN")}/mo for ~${eduGoal.monthsLeft} mo to reach target.`,
    });
  }
  if (Number(settings.secondaryMonthlyIncome) > 0 && Number(settings.monthlyIncome) > 0) {
    headlines.push({
      id: "dual-income",
      tone: "info",
      text: "Household uses combined income — loss of either source would raise pressure.",
    });
  }

  return {
    income,
    dueWeeks,
    forecastMonths,
    heavyMonths: mergedHeavy.slice(0, 4),
    avgMonthlyDue: avgDue,
    familyCalendar,
    goalBalance,
    goalCapacity,
    billPriority,
    creditCard,
    headlines,
    shareSummary: buildShareableStabilitySummary({
      mode,
      cash,
      income,
      forecastMonths,
      heavyMonths: mergedHeavy,
      narrativeHeadline: headlines[0]?.text,
      incomeEntryBasis: settings.incomeEntryBasis === "gross" ? "gross" : "take_home",
    }),
  };
}

export function buildShareableStabilitySummary({
  mode,
  cash,
  income,
  forecastMonths,
  heavyMonths,
  narrativeHeadline,
  incomeEntryBasis = "take_home",
}) {
  const lines = [
    `CommitTrack — ${mode === "family" ? "Household" : "Salary"} stability`,
    narrativeHeadline || "",
    income > 0
      ? `Income (${incomeEntryBasis === "gross" ? "gross" : "take-home"}): ₹${Math.round(income).toLocaleString("en-IN")}/mo`
      : "",
    `Monthly dues: ~₹${Math.round(cash.monthlyBurden).toLocaleString("en-IN")}`,
    `Free after dues: ₹${Math.round(cash.freeMoney).toLocaleString("en-IN")}`,
  ].filter(Boolean);

  if (incomeEntryBasis === "gross") {
    lines.push("Note: Gross income vs bills — if you actually bank less after tax, pressure may look better than this.");
  }

  if (heavyMonths?.[0]) {
    lines.push(`Busy month ahead: ${heavyMonths[0].month} (~₹${heavyMonths[0].due.toLocaleString("en-IN")} due)`);
  }
  const next3 = (forecastMonths || []).slice(0, 3);
  if (next3.length) {
    lines.push(
      "Next months: " + next3.map((m) => `${m.month} ₹${m.due.toLocaleString("en-IN")}`).join(" · ")
    );
  }
  return lines.join("\n");
}
