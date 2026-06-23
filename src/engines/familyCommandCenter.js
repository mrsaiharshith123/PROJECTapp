import { format, parseISO } from "date-fns";
import { computeFamilyPressure } from "./modeFamily.js";
import { computeHouseholdMetrics, computeFamilyEmergencyTarget, normalizeHouseholdMembers } from "./householdEntity.js";
import { computeFamilyStabilityScore } from "./familyStabilityScore.js";
import { buildFamilyExpenseCalendar } from "./familyCalendar.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import { summarizeHouseholdPayerBurden } from "./householdPayer.js";

/** @typedef {'main_earner'|'shared_earner'|'parent'|'dependent'|'contributor'|'vulnerable'} FamilyMemberArchetype */

const ROLE_MAP = {
  owner: "main_earner",
  spouse: "shared_earner",
  parent: "parent",
  dependent: "dependent",
  contributor: "contributor",
};

function analyzeFamilyDependency({ settings, commitments, getEffectiveStatus }) {
  const members = normalizeHouseholdMembers(settings?.householdMembers);
  const income = combinedMonthlyIncome(settings);
  const primary = Math.max(0, Number(settings?.monthlyIncome) || 0);
  const secondary = Math.max(0, Number(settings?.secondaryMonthlyIncome) || 0);
  const dependents = Math.max(0, Number(settings?.dependents) || 0);
  const { by: payer } = summarizeHouseholdPayerBurden(commitments, getEffectiveStatus);

  const dependentCount = members.filter((m) => m.role === "dependent" || m.role === "parent").length;
  const earners = members.filter((m) => m.role === "owner" || m.role === "spouse" || m.incomeShare > 0);

  const incomeConcentrationPct = income > 0 ? Math.round((primary / income) * 100) : null;
  const overloaded =
    incomeConcentrationPct != null &&
    incomeConcentrationPct >= 75 &&
    (dependentCount >= 2 || dependents >= 2);

  const insights = [];
  if (overloaded) {
    insights.push({
      id: "family-income-concentration",
      tone: "caution",
      params: { pct: incomeConcentrationPct },
    });
  }
  if (dependentCount >= 2 && income > 0 && payer.primary > income * 0.55) {
    insights.push({
      id: "family-dependency-burden",
      tone: "info",
      params: { count: Math.max(dependentCount, dependents) },
    });
  }
  if (secondary <= 0 && dependents >= 1 && incomeConcentrationPct >= 70) {
    insights.push({
      id: "family-single-earner-risk",
      tone: "warning",
      params: { dependents },
    });
  }

  return {
    members: members.map((m) => ({
      id: m.id,
      label: m.label,
      role: m.role,
      archetype: /** @type {FamilyMemberArchetype} */ (ROLE_MAP[m.role] || "contributor"),
      incomeShare: m.incomeShare,
      dependencyLevel: m.role === "dependent" || m.role === "parent" ? "high" : m.role === "owner" ? "low" : "medium",
    })),
    dependentCount: Math.max(dependentCount, dependents),
    earnerCount: Math.max(earners.length, secondary > 0 ? 2 : 1),
    incomeConcentrationPct,
    payerBurden: payer,
    overloaded,
    insights,
  };
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

function buildFamilyContributionMemory(commitments, getEffectiveStatus, todayStr = "") {
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

function buildFamilyPressureForecast({
  commitments,
  todayStr,
  getEffectiveStatus,
  aheadPlan = null,
  pressureIntel = null,
  emergencyPct = null,
}) {
  const calendar = buildFamilyExpenseCalendar(commitments, todayStr, getEffectiveStatus, 8);
  /** @type {Array<{ id: string; tone: string; params?: Record<string, unknown> }>} */
  const insights = [...(calendar.insights || [])];

  if (pressureIntel?.nextMonth?.delta > 8) {
    insights.push({
      id: "family-forecast-pressure-rise",
      tone: "caution",
      params: { delta: Math.round(pressureIntel.nextMonth.delta) },
    });
  }

  const risky = (aheadPlan?.forecastMonths || []).filter((m) => m.freeCash < 0).slice(0, 2);
  if (risky.length) {
    insights.push({
      id: "family-forecast-low-liquidity",
      tone: "warning",
      params: { month: risky[0].label || risky[0].monthKey },
    });
  }

  if (emergencyPct != null && emergencyPct < 40) {
    insights.push({
      id: "family-forecast-emergency-weak",
      tone: "caution",
      params: { pct: emergencyPct },
    });
  }

  const schoolMonths = calendar.months.filter((m) =>
    m.items.some((i) => i.category === "School"),
  );
  if (schoolMonths[0]) {
    insights.push({
      id: "family-forecast-school-window",
      tone: "info",
      params: { month: schoolMonths[0].label, amount: Math.round(schoolMonths[0].amount) },
    });
  }

  return {
    calendar,
    heavyMonths: calendar.heavyMonths,
    riskyMonths: risky,
    insights: insights.slice(0, 6),
  };
}

/**
 * Family Financial Operating System — orchestrates household intelligence for UI.
 */
export function buildFamilyCommandCenter({
  settings,
  commitments,
  goals = [],
  getEffectiveStatus,
  todayStr,
  pressureScore = null,
  survivalMonths = null,
  overdueCount = 0,
  aheadPlan = null,
  pressureIntel = null,
}) {
  const income = combinedMonthlyIncome(settings);
  const family = computeFamilyPressure(commitments, income, getEffectiveStatus, settings?.dependents || 0);
  const household = computeHouseholdMetrics({ settings, commitments, getEffectiveStatus, todayStr });
  const emergencyTarget = computeFamilyEmergencyTarget(settings, commitments, getEffectiveStatus);
  const liquid = Math.max(0, Number(settings?.liquidSavings) || 0);
  const emergencyPct =
    emergencyTarget.targetAmount > 0
      ? Math.min(100, Math.round((liquid / emergencyTarget.targetAmount) * 100))
      : null;

  const stability = computeFamilyStabilityScore({
    settings,
    commitments,
    getEffectiveStatus,
    pressureScore: family.familyPressureScore ?? pressureScore,
    emergencyPct,
    survivalMonths,
    overdueCount,
  });

  const dependency = analyzeFamilyDependency({ settings, commitments, getEffectiveStatus });
  const contribution = buildFamilyContributionMemory(commitments, getEffectiveStatus, todayStr);
  const forecast = buildFamilyPressureForecast({
    commitments,
    todayStr,
    getEffectiveStatus,
    aheadPlan,
    pressureIntel,
    emergencyPct,
  });

  const sharedGoals = (goals || []).filter((g) => g.status !== "completed").slice(0, 4);

  const insights = [
    ...family.insights,
    ...dependency.insights,
    ...forecast.insights,
    ...contribution.memories,
  ].slice(0, 8);

  return {
    stability,
    household,
    family,
    dependency,
    contribution,
    forecast,
    emergencyTarget,
    emergencyPct,
    sharedGoals,
    insights,
    income,
    obligationsOpen: household.combinedBurden,
    freeCash: household.combinedFreeCash,
  };
}
