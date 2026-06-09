import { totalMonthlyBurden } from "./burden.js";
import { computePaymentMonthStreak, computeControlScore } from "../utils/profileStats.js";
import { totalOverdueAmount, linearRegressionSlope } from "./pressureScore.js";

/** @typedef {"excellent" | "good" | "caution" | "risky" | "surviving" | "balancing" | "stable" | "strengthening" | "thriving"} HealthLevel */

const ESSENTIAL_BUFFER_MONTHS = 3;

function isOpenBill(commitment, getEffectiveStatus) {
  const status = getEffectiveStatus(commitment);
  return status !== "paid" && status !== "skipped";
}

function clampScore(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function computeBurdenComponent(commitments, income, getEffectiveStatus) {
  const inc = Math.max(0, income || 0);
  const ratio = inc > 0 ? totalMonthlyBurden(commitments, getEffectiveStatus) / inc : 0;
  const overdueAmt = totalOverdueAmount(commitments, getEffectiveStatus);
  const overdueRatio = inc > 0 ? overdueAmt / inc : overdueAmt > 0 ? 1 : 0;

  let score = 100;
  score -= Math.min(55, Math.round(ratio * 60));
  score -= Math.min(30, Math.round(overdueRatio * 40));
  return clampScore(score);
}

function computeBehaviourComponent(commitments, lendings, getEffectiveStatus) {
  const control = computeControlScore(commitments, getEffectiveStatus);
  const streak = computePaymentMonthStreak(commitments, lendings);
  let score = control * 0.75 + Math.min(10, streak) * 2.5;
  return clampScore(score);
}

function computeBufferComponent(income, freeMoneyAfterBurden, liquidSavings = 0, monthlyBurden = 0) {
  const inc = Math.max(0, income || 0);
  const free = Number(freeMoneyAfterBurden) || 0;
  const liquid = Math.max(0, Number(liquidSavings) || 0);
  const burn = Math.max(0, monthlyBurden);

  let score = 50;
  if (inc > 0) {
    const freeRatio = free / inc;
    score += Math.min(30, Math.round(freeRatio * 40));
    if (free < 0) score -= 25;
    else if (free < inc * 0.05) score -= 15;
  }

  if (burn > 0) {
    const runway = (liquid + Math.max(0, free)) / burn;
    if (runway >= ESSENTIAL_BUFFER_MONTHS * 2) score += 20;
    else if (runway >= ESSENTIAL_BUFFER_MONTHS) score += 10;
    else if (runway < 1) score -= 20;
  } else if (liquid > 0) {
    score += 15;
  }

  return clampScore(score);
}

function computeTrajectoryComponent(monthlySnapshots = [], commitments, getEffectiveStatus) {
  const sorted = [...(monthlySnapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
  const pressures = sorted.slice(-3).map((s) => Number(s.pressureScore) || 0);
  const slope = linearRegressionSlope(pressures);

  let score = 55;
  if (pressures.length >= 2) {
    if (slope < -2) score += 25;
    else if (slope > 2) score -= 20;
    else score += 5;
  }

  const openNow = (commitments || []).filter((c) => isOpenBill(c, getEffectiveStatus)).length;
  if (sorted.length >= 2) {
    const prevOpen = sorted[sorted.length - 2].openBillCount;
    if (prevOpen != null && openNow < prevOpen) score += 10;
    if (prevOpen != null && openNow > prevOpen) score -= 8;
  }

  return clampScore(score);
}

function healthPostureFromScore(score) {
  if (score >= 88) return { level: "thriving", label: "Thriving" };
  if (score >= 78) return { level: "strengthening", label: "Strengthening" };
  if (score >= 68) return { level: "stable", label: "Stable" };
  if (score >= 55) return { level: "balancing", label: "Balancing" };
  if (score >= 40) return { level: "surviving", label: "Surviving" };
  if (score >= 28) return { level: "caution", label: "Caution" };
  return { level: "risky", label: "At risk" };
}

function buildImprovementPath(components) {
  const paths = [];
  const weakest = [
    { key: "burden", label: "burden", score: components.burdenScore },
    { key: "behaviour", label: "repayment behaviour", score: components.behaviourScore },
    { key: "buffer", label: "emergency buffer", score: components.bufferScore },
    { key: "trajectory", label: "financial trajectory", score: components.trajectoryScore },
  ].sort((a, b) => a.score - b.score);

  const w = weakest[0];
  if (w.key === "burden") {
    paths.push("Reducing discretionary commitments would improve burden score fastest.");
  } else if (w.key === "buffer") {
    paths.push("Emergency savings remain the largest weakness.");
  } else if (w.key === "behaviour") {
    paths.push("Consistent on-time payments would strengthen behaviour score.");
  } else {
    paths.push("Sustained debt reduction over the next few months would improve trajectory.");
  }

  if (components.bufferScore < 45) {
    paths.push("Building a 3–6 month emergency reserve should be the priority.");
  }

  return paths;
}

/**
 * Multi-dimensional 0–100 financial health score (not a credit score).
 */
export function computeFinancialHealthScore(input) {
  const {
    commitments,
    lendings,
    income,
    getEffectiveStatus,
    openRemaining,
    freeMoneyAfterBurden,
    liquidSavings = 0,
    monthlySnapshots = [],
  } = input;

  const list = commitments || [];
  const burden = totalMonthlyBurden(list, getEffectiveStatus);

  const burdenScore = computeBurdenComponent(list, income, getEffectiveStatus);
  const behaviourScore = computeBehaviourComponent(list, lendings, getEffectiveStatus);
  const bufferScore = computeBufferComponent(income, freeMoneyAfterBurden, liquidSavings, burden);
  const trajectoryScore = computeTrajectoryComponent(monthlySnapshots, list, getEffectiveStatus);

  const score = clampScore(
    burdenScore * 0.3 + behaviourScore * 0.25 + bufferScore * 0.25 + trajectoryScore * 0.2,
  );

  const posture = healthPostureFromScore(score);
  const improvementPath = buildImprovementPath({
    burdenScore,
    behaviourScore,
    bufferScore,
    trajectoryScore,
  });

  return {
    score,
    level: posture.level,
    label: posture.label,
    openRemaining: openRemaining ?? 0,
    burdenScore,
    behaviourScore,
    bufferScore,
    trajectoryScore,
    improvementPath,
    tone: healthLevelToTone(posture.level),
  };
}

/** Semantic tone token for UI mapping. */
export function healthLevelToTone(level) {
  switch (level) {
    case "excellent":
    case "thriving":
    case "strengthening":
      return "success";
    case "good":
    case "stable":
    case "balancing":
      return "info";
    case "caution":
    case "surviving":
    case "vulnerable":
      return "warning";
    case "risky":
    case "fragile":
    case "critical":
      return "danger";
    default:
      return "neutral";
  }
}
