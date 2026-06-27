import { addMonths, format, parseISO } from "date-fns";
import { totalMonthlyBurden } from "./burden.js";
import { resolveDailyLivingCost } from "./lifestyleBurn.js";
import { safeNum } from "./_guard.js";

/** @typedef {"critical" | "weak" | "moderate" | "healthy" | "strong"} SurvivalTier */
/** @typedef {"stable" | "vulnerable" | "fragile" | "critical"} SurvivalClassification */

const TIER_LABELS = {
  critical: "Critical",
  weak: "Weak",
  moderate: "Moderate",
  healthy: "Healthy",
  strong: "Strong",
};

const ESSENTIAL_CATEGORIES = new Set([
  "Rent",
  "EMI",
  "Utility",
  "Groceries",
  "Insurance",
  "Education",
  "School",
  "Food",
]);

const STRESSED_EMERGENCY_HIT = 150_000;

export function survivalTierFromMonths(months) {
  if (months == null || !Number.isFinite(months)) return { tier: "critical", label: TIER_LABELS.critical };
  if (months < 2) return { tier: "critical", label: TIER_LABELS.critical };
  if (months < 4) return { tier: "weak", label: TIER_LABELS.weak };
  if (months < 6) return { tier: "moderate", label: TIER_LABELS.moderate };
  if (months < 12) return { tier: "healthy", label: TIER_LABELS.healthy };
  return { tier: "strong", label: TIER_LABELS.strong };
}

/** Semantic tone for UI — no CSS classes. */
export function survivalTierTone(tier) {
  switch (tier) {
    case "strong":
      return "success";
    case "healthy":
      return "teal";
    case "moderate":
      return "warning";
    case "weak":
      return "coral";
    case "critical":
      return "danger";
    default:
      return "neutral";
  }
}

function essentialMonthlyBurden(commitments, getEffectiveStatus) {
  let sum = 0;
  for (const c of commitments || []) {
    if (getEffectiveStatus(c) === "paid") continue;
    if (!ESSENTIAL_CATEGORIES.has(c.category)) continue;
    sum += Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
  }
  return sum;
}

function computeRunwayMonths(pool, burn) {
  if (burn <= 0) return pool > 0 ? 99 : null;
  return Math.round((pool / burn) * 10) / 10;
}

function breakingMonthLabel(runwayMonths, todayStr) {
  if (runwayMonths == null || runwayMonths >= 99) return null;
  if (!todayStr) return null;
  try {
    const breakDate = addMonths(parseISO(`${todayStr}T12:00:00`), Math.max(0, Math.floor(runwayMonths)));
    return format(breakDate, "MMM yyyy");
  } catch {
    return null;
  }
}

/**
 * @param {object} params
 */
function runScenario({
  income,
  freeMoney,
  liquidSavings,
  monthlyBurden,
  lendingOutflow = 0,
  emergencyHit = 0,
  todayStr = "",
}) {
  const burn = Math.max(0, monthlyBurden + Math.max(0, lendingOutflow));
  const pool = Math.max(0, liquidSavings) + Math.max(0, freeMoney) - Math.max(0, emergencyHit);
  const runwayMonths = computeRunwayMonths(pool, burn);
  const { tier, label: tierLabel } = survivalTierFromMonths(runwayMonths);
  const inc = Math.max(0, income || 0);

  return {
    runwayMonths,
    breakingMonth: breakingMonthLabel(runwayMonths, todayStr),
    freeCashflow: Math.round(inc - burn),
    requiredMonthlyBurn: Math.round(burn),
    tier,
    tierLabel,
    tone: survivalTierTone(tier),
    poolAfterEmergency: Math.round(pool),
  };
}

function survivalClassification(baselineMonths, stressedMonths) {
  if (baselineMonths == null || baselineMonths < 2) return "critical";
  if (baselineMonths < 4 || (stressedMonths != null && stressedMonths < 2)) return "fragile";
  if (baselineMonths < 6 || (stressedMonths != null && stressedMonths < 4)) return "vulnerable";
  return "stable";
}

function timeToSafetyMonths(liquidSavings, freeMoney, monthlyBurden, monthlySavingsRate) {
  const burn = Math.max(0, monthlyBurden);
  const target = burn * 6;
  const current = Math.max(0, liquidSavings) + Math.max(0, freeMoney);
  const save = Math.max(0, monthlySavingsRate);
  if (current >= target) return 0;
  if (save <= 0) return null;
  return Math.ceil((target - current) / save);
}

function buildSurvivalNarratives(baseline, stressed, classification, timeToSafety) {
  const lines = [];
  if (baseline.runwayMonths != null) {
    lines.push(`Current emergency reserves cover about ${baseline.runwayMonths} month${baseline.runwayMonths === 1 ? "" : "s"}.`);
  }
  if (stressed?.runwayMonths != null && stressed.runwayMonths < 2) {
    lines.push("Under income disruption, runway falls below 60 days.");
  }
  if (classification === "stable" && timeToSafety != null && timeToSafety > 0) {
    lines.push(`At current savings pace, a 6-month safety buffer may take about ${timeToSafety} month${timeToSafety === 1 ? "" : "s"}.`);
  }
  if (classification === "stable") {
    lines.push("Savings behaviour is rebuilding financial safety.");
  }
  return lines;
}

/**
 * How long user can cover monthly burn using liquid savings + current free cash runway.
 */
export function computeSurvivalAnalysis({
  income,
  freeMoney,
  liquidSavings,
  monthlyBurden,
  lendingOutflow = 0,
  lifestyleMonthlyBurn = 0,
  lifestyle = null,
  commitments = [],
  getEffectiveStatus = () => "pending",
  todayStr = "",
  monthlySavingsRate = null,
}) {
  const inc = Math.max(0, income || 0);
  const liquid = Math.max(0, liquidSavings);
  const free = Math.max(0, freeMoney);
  const lifestyleBurn = Math.max(0, lifestyleMonthlyBurn);
  const totalBurn = Math.max(0, monthlyBurden) + Math.max(0, lendingOutflow) + lifestyleBurn;
  const saveRate =
    monthlySavingsRate != null
      ? monthlySavingsRate
      : Math.max(0, inc - totalBurn);

  if (totalBurn <= 0) {
    const pool = liquid + free;
    return {
      survivalMonths: pool > 0 ? 99 : null,
      monthlyBurn: 0,
      liquidSavings: liquid,
      tier: "strong",
      tierLabel: TIER_LABELS.strong,
      tone: survivalTierTone("strong"),
      headline: "No fixed monthly burn tracked — add bills to refine survival estimate.",
      warnings: [],
      scenarios: null,
      classification: "stable",
      timeToSafetyMonths: null,
      narrativeLines: [],
    };
  }

  const baseline = runScenario({
    income: inc,
    freeMoney: free,
    liquidSavings: liquid,
    monthlyBurden: totalBurn,
    lendingOutflow: 0,
    todayStr,
  });

  const stressedBurden = totalBurn;
  const stressedIncome = Math.round(inc * 0.7);
  const stressedFree = Math.max(0, stressedIncome - totalBurn);

  const stressed = runScenario({
    income: stressedIncome,
    freeMoney: stressedFree,
    liquidSavings: liquid,
    monthlyBurden: stressedBurden,
    lendingOutflow: 0,
    emergencyHit: STRESSED_EMERGENCY_HIT,
    todayStr,
  });

  const essentialBurn =
    essentialMonthlyBurden(commitments, getEffectiveStatus) +
    Math.max(0, lendingOutflow) +
    lifestyleBurn;
  const critical = runScenario({
    income: 0,
    freeMoney: 0,
    liquidSavings: liquid,
    monthlyBurden: essentialBurn > 0 ? essentialBurn : totalBurn,
    lendingOutflow: 0,
    todayStr,
  });

  const classification = survivalClassification(baseline.runwayMonths, stressed.runwayMonths);
  const timeToSafety = timeToSafetyMonths(liquid, free, totalBurn, saveRate);
  const warnings = [];
  if (baseline.runwayMonths != null && baseline.runwayMonths < 4) {
    warnings.push("Emergency reserve is below a commonly recommended safe level (3–6 months of expenses).");
  }
  if (inc > 0 && free < inc * 0.1) {
    warnings.push("Very little free cash after monthly obligations — income shock would hurt quickly.");
  }

  const narrativeLines = buildSurvivalNarratives(baseline, stressed, classification, timeToSafety);

  const lifestyleNote =
    lifestyle?.source === "logged"
      ? `Includes ~₹${lifestyle.dailyInr.toLocaleString("en-IN")}/day from your recent spend logs.`
      : lifestyle?.cityLabel
        ? `Includes ~₹${lifestyle.dailyInr.toLocaleString("en-IN")}/day living costs for ${lifestyle.cityLabel}.`
        : null;

  const result = {
    survivalMonths: baseline.runwayMonths == null ? null : safeNum(baseline.runwayMonths, 0),
    monthlyBurn: baseline.requiredMonthlyBurn,
    lifestyleMonthlyBurn: lifestyleBurn,
    lifestyle,
    lifestyleNote,
    liquidSavings: liquid,
    tier: baseline.tier,
    tierLabel: baseline.tierLabel,
    tone: baseline.tone,
    headline: `If income stops today, you can survive about ${baseline.runwayMonths} month${baseline.runwayMonths === 1 ? "" : "s"}.`,
    warnings,
    scenarios: {
      baseline,
      stressed,
      critical,
    },
    classification,
    timeToSafetyMonths: timeToSafety,
    narrativeLines,
  };
  if (result.survivalMonths != null && !Number.isFinite(result.survivalMonths)) {
    result.survivalMonths = 0;
  } else if (result.survivalMonths != null) {
    result.survivalMonths = Math.max(0, result.survivalMonths);
  }
  result.monthlyBurn = safeNum(result.monthlyBurn, 0);
  return result;
}

/** Monthly outflow from borrowed money (debt) still owed. */
export function lendingMonthlyOutflow(lendings, getEffectiveLendingStatus, todayStr) {
  let sum = 0;
  for (const l of lendings) {
    if (l.type !== "borrowed") continue;
    if (getEffectiveLendingStatus(l, todayStr) === "complete") continue;
    const rem = Number(l.remainingAmount) || 0;
    if (rem <= 0) continue;
    const schedule = l.repaymentSchedule || [];
    if (schedule.length > 0) {
      const pending = schedule.find((r) => r.paymentStatus !== "paid");
      if (pending) sum += Math.max(0, Number(pending.totalPayment) || 0);
      else sum += rem / Math.max(1, schedule.filter((r) => r.paymentStatus !== "paid").length || 1);
    } else {
      sum += rem / 12;
    }
  }
  return sum;
}

export function buildSurvivalContext(
  commitments,
  lendings,
  settings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
  cashMetrics,
  dailySpends = [],
) {
  const income = Math.max(0, Number(settings.monthlyIncome) || 0);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const lendingOut = lendingMonthlyOutflow(lendings, getEffectiveLendingStatus, todayStr);
  const freeMoney = cashMetrics?.freeMoney ?? Math.max(0, income - burden);
  const lifestyle = resolveDailyLivingCost({ settings, dailySpends, todayStr });
  return computeSurvivalAnalysis({
    income,
    freeMoney,
    liquidSavings: Math.max(0, Number(settings.liquidSavings) || 0),
    monthlyBurden: burden,
    lendingOutflow: lendingOut,
    lifestyleMonthlyBurn: lifestyle.monthlyInr,
    lifestyle,
    commitments,
    getEffectiveStatus,
    todayStr,
    monthlySavingsRate: Math.max(0, freeMoney),
  });
}
