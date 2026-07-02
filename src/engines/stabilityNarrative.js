import { computePaymentMonthStreak } from "../utils/profileStats.js";

/**
 * Human-readable financial health summary (composes existing scores — no duplicate math).
 * Returns i18n keys — translate in UI via translateEngineMessage().
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
  void mode;
  const strengths = [];
  const weaknesses = [];

  const streak = computePaymentMonthStreak(commitments, lendings);
  if (streak >= 2) strengths.push({ key: "narrative.strength.repaymentRhythm" });
  if (health?.level === "excellent" || health?.level === "good") {
    strengths.push({ key: "narrative.strength.billHealth" });
  }
  if (stability?.score != null && stability.score <= 45) {
    strengths.push({ key: "narrative.strength.commitmentsRoom" });
  }
  if (survival?.tier === "healthy" || survival?.tier === "strong") {
    strengths.push({
      key: "narrative.strength.runway",
      params: { months: survival.survivalMonths },
    });
  }
  if (lifestyle?.growthPercent != null && lifestyle.growthPercent < 15) {
    strengths.push({ key: "narrative.strength.recurringStable" });
  }

  if (overdueCount > 0) {
    weaknesses.push(
      overdueCount === 1
        ? { key: "narrative.weakness.overdueOne" }
        : { key: "narrative.weakness.overdueMany", params: { count: overdueCount } },
    );
  }
  if (stability?.committedPercent != null && stability.committedPercent > 65) {
    weaknesses.push({
      key: "narrative.weakness.incomeCommitted",
      params: { percent: stability.committedPercent },
    });
  }
  if (emergency?.progressPercent != null && emergency.progressPercent < 40 && emergency.recommended > 0) {
    weaknesses.push({ key: "narrative.weakness.emergencyLow" });
  }
  if (lifestyle?.growthPercent != null && lifestyle.growthPercent >= 25) {
    weaknesses.push({
      key: "narrative.weakness.lifestyleInflation",
      params: { percent: lifestyle.growthPercent },
    });
  }
  if (survival?.tier === "critical" || survival?.tier === "weak") {
    weaknesses.push({ key: "narrative.weakness.thinRunway" });
  }

  const stabilityLabelKey =
    health?.level === "excellent"
      ? "narrative.label.strong"
      : health?.level === "good"
        ? "narrative.label.moderate"
        : health?.level === "caution"
          ? "narrative.label.stretched"
          : "narrative.label.fragile";

  const headlineKey = "narrative.headline.salaried";

  return {
    headlineKey,
    headlineParams: { labelKey: stabilityLabelKey },
    stabilityLabelKey,
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
  };
}
