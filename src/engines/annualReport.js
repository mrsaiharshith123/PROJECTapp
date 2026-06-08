import { computeCanonicalPressureScore, pressureScoreLabel } from "./pressureScore.js";
import { buildSurvivalContext } from "./survival.js";
import { rankStressContributors } from "./stressContributors.js";
import { subscriptionLeakReport } from "./subscriptionLeak.js";
import { detectLifestyleInflation } from "./lifestyleInflation.js";
import { freeMoneyAfterBurden } from "./pressureScore.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";

function reportYearLabel(ref = new Date()) {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  if (m >= 3) return `FY ${y}–${String(y + 1).slice(-2)}`;
  return `FY ${y - 1}–${String(y).slice(-2)}`;
}

/**
 * @param {object} ctx
 */
export function buildAnnualReportData(ctx) {
  const {
    commitments = [],
    lendings = [],
    settings = {},
    monthlySnapshots = [],
    getEffectiveStatus,
    getEffectiveLendingStatus,
    todayStr,
  } = ctx;

  const income = combinedMonthlyIncome(settings);
  const cash = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);
  const pressureScore = computeCanonicalPressureScore({
    commitments,
    income,
    getEffectiveStatus,
    monthlySnapshots,
  });
  const pressureMeta = pressureScoreLabel(pressureScore);
  const survival = buildSurvivalContext(
    commitments,
    lendings,
    settings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    todayStr,
    { freeMoney: cash.freeMoney },
  );

  const snapshotTrend = [...(monthlySnapshots || [])]
    .filter((s) => s && (s.monthKey || s.month))
    .sort((a, b) => String(a.monthKey || a.month).localeCompare(String(b.monthKey || b.month)))
    .slice(-6);

  return {
    generatedAt: new Date().toISOString(),
    userName: settings.displayName?.trim() || "You",
    userMode: settings.userMode || "salaried",
    reportYear: reportYearLabel(),
    pressureScore,
    pressureLabel: pressureMeta.label,
    survivalMonths: survival.survivalMonths,
    totalCommitments: commitments.length,
    totalMonthlyBurden: cash.monthlyBurden,
    freeCash: cash.freeMoney,
    topStressors: rankStressContributors(commitments, getEffectiveStatus, 3),
    subscriptionAudit: subscriptionLeakReport(commitments, getEffectiveStatus, todayStr),
    lifestyleInflation: detectLifestyleInflation(commitments, getEffectiveStatus),
    snapshotTrend,
  };
}
