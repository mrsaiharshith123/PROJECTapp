import { totalMonthlyBurden } from "./burden.js";

/** @typedef {"critical" | "weak" | "moderate" | "healthy" | "strong"} SurvivalTier */

const TIER_LABELS = {
  critical: "Critical",
  weak: "Weak",
  moderate: "Moderate",
  healthy: "Healthy",
  strong: "Strong",
};

export function survivalTierFromMonths(months) {
  if (months == null || !Number.isFinite(months)) return { tier: "critical", label: TIER_LABELS.critical };
  if (months < 2) return { tier: "critical", label: TIER_LABELS.critical };
  if (months < 4) return { tier: "weak", label: TIER_LABELS.weak };
  if (months < 6) return { tier: "moderate", label: TIER_LABELS.moderate };
  if (months < 12) return { tier: "healthy", label: TIER_LABELS.healthy };
  return { tier: "strong", label: TIER_LABELS.strong };
}

export function survivalTierBadgeClass(tier) {
  switch (tier) {
    case "strong":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
    case "healthy":
      return "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800";
    case "moderate":
      return "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
    case "weak":
      return "bg-orange-100 text-orange-900 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800";
    default:
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800";
  }
}

/**
 * How long user can cover monthly burn using liquid savings + current free cash runway.
 * @param {{ income: number, freeMoney: number, liquidSavings: number, monthlyBurden: number, lendingOutflow: number }} params
 */
export function computeSurvivalAnalysis({ income, freeMoney, liquidSavings, monthlyBurden, lendingOutflow = 0 }) {
  const burn = Math.max(0, monthlyBurden + Math.max(0, lendingOutflow));
  const liquid = Math.max(0, liquidSavings);
  const free = Math.max(0, freeMoney);

  if (burn <= 0) {
    const pool = liquid + free;
    return {
      survivalMonths: pool > 0 ? 99 : null,
      monthlyBurn: 0,
      liquidSavings: liquid,
      tier: "strong",
      tierLabel: TIER_LABELS.strong,
      headline: "No fixed monthly burn tracked — add bills to refine survival estimate.",
      warnings: [],
      badgeClass: survivalTierBadgeClass("strong"),
    };
  }

  const pool = liquid + free;
  const survivalMonths = pool / burn;
  const { tier, label: tierLabel } = survivalTierFromMonths(survivalMonths);
  const warnings = [];
  if (survivalMonths < 4) {
    warnings.push("Emergency reserve is below a commonly recommended safe level (3–6 months of expenses).");
  }
  if (income > 0 && free < income * 0.1) {
    warnings.push("Very little free cash after monthly obligations — income shock would hurt quickly.");
  }

  const monthsRounded = Math.round(survivalMonths * 10) / 10;
  return {
    survivalMonths: monthsRounded,
    monthlyBurn: Math.round(burn),
    liquidSavings: liquid,
    tier,
    tierLabel,
    headline: `If income stops today, you can survive about ${monthsRounded} month${monthsRounded === 1 ? "" : "s"}.`,
    warnings,
    badgeClass: survivalTierBadgeClass(tier),
  };
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

export function buildSurvivalContext(commitments, lendings, settings, getEffectiveStatus, getEffectiveLendingStatus, todayStr, cashMetrics) {
  const income = Math.max(0, Number(settings.monthlyIncome) || 0);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const lendingOut = lendingMonthlyOutflow(lendings, getEffectiveLendingStatus, todayStr);
  return computeSurvivalAnalysis({
    income,
    freeMoney: cashMetrics?.freeMoney ?? Math.max(0, income - burden),
    liquidSavings: Math.max(0, Number(settings.liquidSavings) || 0),
    monthlyBurden: burden,
    lendingOutflow: lendingOut,
  });
}
