import { perovoTierFromScore } from "../constants/metricTaxonomy.js";

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
}

/**
 * @param {number | null | undefined} current
 * @param {number | null | undefined} previous
 * @returns {'up' | 'down' | 'flat' | null}
 */
export function pillarTrend(current, previous) {
  if (current == null || previous == null) return null;
  const delta = current - previous;
  if (delta >= 3) return "up";
  if (delta <= -3) return "down";
  return "flat";
}

/**
 * Map debt health engine output to 0–100 for the Debt pillar.
 * @param {{ emiOverloadPct?: number, pressureLevel?: string, highRiskDebtCount?: number } | null | undefined} debtHealth
 */
export function debtHealthToScore(debtHealth) {
  if (!debtHealth) return 65;
  const emiPct = debtHealth.emiOverloadPct ?? 50;
  let score = Math.max(0, Math.min(100, Math.round(85 - emiPct * 0.85)));
  if (debtHealth.pressureLevel === "low") score = Math.min(100, score + 10);
  else if (debtHealth.pressureLevel === "high") score = Math.max(0, score - 10);
  else if (debtHealth.pressureLevel === "critical") score = Math.max(0, score - 25);
  if (debtHealth.highRiskDebtCount > 0) {
    score = Math.max(0, score - debtHealth.highRiskDebtCount * 3);
  }
  return score;
}

/**
 * Single headline Perovo Score (0–100) + four pillar sub-scores.
 * Consolidates legacy engines — UI should only show these five numbers.
 *
 * @param {{
 *   pressureScore?: number,
 *   health?: { bufferScore?: number, behaviourScore?: number, trajectoryScore?: number },
 *   billPortfolioScore?: number,
 *   emergencyProgressPercent?: number,
 *   debtHealthScore?: number,
 *   creditUtilizationPercent?: number | null,
 *   goalsOnTrackRatio?: number,
 *   previousPillars?: Partial<Record<string, number>>,
 * }} input
 */
export function computePerovoScore(input) {
  const pressure = clamp(input.pressureScore ?? 50);
  const billScore = clamp(input.billPortfolioScore ?? 70);
  const cashflow = clamp((100 - pressure) * 0.55 + billScore * 0.45);

  const buffer = clamp(input.health?.bufferScore ?? 50);
  const emergency = clamp(input.emergencyProgressPercent ?? 0);
  const savings = clamp(buffer * 0.55 + emergency * 0.45);

  const debtHealth = clamp(input.debtHealthScore ?? 65);
  const creditFactor =
    input.creditUtilizationPercent != null
      ? clamp(100 - input.creditUtilizationPercent)
      : debtHealth;
  const debt = clamp(debtHealth * 0.65 + creditFactor * 0.35);

  const behaviour = clamp(input.health?.behaviourScore ?? 50);
  const trajectory = clamp(input.health?.trajectoryScore ?? 50);
  const goalsFactor = clamp((input.goalsOnTrackRatio ?? 0.5) * 100);
  const protection = clamp(behaviour * 0.4 + trajectory * 0.35 + goalsFactor * 0.25);

  const score = clamp((cashflow + savings + debt + protection) / 4);
  const tier = perovoTierFromScore(score);
  const prev = input.previousPillars || {};

  const pillars = {
    cashflow: {
      score: cashflow,
      trend: pillarTrend(cashflow, prev.cashflow),
    },
    savings: {
      score: savings,
      trend: pillarTrend(savings, prev.savings),
    },
    debt: {
      score: debt,
      trend: pillarTrend(debt, prev.debt),
    },
    protection: {
      score: protection,
      trend: pillarTrend(protection, prev.protection),
    },
  };

  return { score, tier, pillars };
}
