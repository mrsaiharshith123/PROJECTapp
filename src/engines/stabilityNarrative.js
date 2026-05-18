import { computePaymentMonthStreak } from "../utils/profileStats.js";

/**
 * Human-readable salary / household health summary (composes existing scores — no duplicate math).
 */
export function buildStabilityHealthNarrative({
  mode = "salaried",
  health,
  stability,
  survival,
  emergency,
  lifestyle,
  overdueCount = 0,
  commitments = [],
  lendings = [],
}) {
  const strengths = [];
  const weaknesses = [];

  const streak = computePaymentMonthStreak(commitments, lendings);
  if (streak >= 2) strengths.push("Steady repayment rhythm over recent months");
  if (health?.level === "excellent" || health?.level === "good") {
    strengths.push("Overall bill health looks manageable");
  }
  if (stability?.score != null && stability.score <= 45) {
    strengths.push("Monthly commitments leave reasonable room in your budget");
  }
  if (survival?.tier === "healthy" || survival?.tier === "strong") {
    strengths.push(`Runway about ${survival.survivalMonths} months if income paused`);
  }
  if (lifestyle?.growthPercent != null && lifestyle.growthPercent < 15) {
    strengths.push("Recurring spend has not spiked sharply lately");
  }

  if (overdueCount > 0) {
    weaknesses.push(
      overdueCount === 1 ? "One overdue bill needs attention" : `${overdueCount} overdue bills add stress`
    );
  }
  if (stability?.committedPercent != null && stability.committedPercent > 65) {
    weaknesses.push(`About ${stability.committedPercent}% of income goes to monthly dues`);
  }
  if (emergency?.progressPercent != null && emergency.progressPercent < 40 && emergency.recommended > 0) {
    weaknesses.push("Emergency reserve is below a comfortable buffer");
  }
  if (lifestyle?.growthPercent != null && lifestyle.growthPercent >= 25) {
    weaknesses.push(`Recurring costs grew ~${lifestyle.growthPercent}% — lifestyle inflation signal`);
  }
  if (survival?.tier === "critical" || survival?.tier === "weak") {
    weaknesses.push("Thin survival runway if income stops");
  }

  const label =
    health?.level === "excellent"
      ? "Strong"
      : health?.level === "good"
        ? "Moderate"
        : health?.level === "caution"
          ? "Stretched"
          : "Fragile";

  const headline =
    mode === "family"
      ? `Family financial stability: ${label}`
      : `Financial stability: ${label}`;

  return {
    headline,
    stabilityLabel: label,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
  };
}
