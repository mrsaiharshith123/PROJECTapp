import { format, parseISO } from "date-fns";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import { computeHouseholdMetrics } from "./householdEntity.js";
import { computeFamilyStabilityScore } from "./familyStabilityScore.js";
import { totalMonthlyBurden } from "./burden.js";

/**
 * @param {object} input
 */
export function buildFamilyMonthlyReport({
  settings,
  commitments,
  getEffectiveStatus,
  todayStr,
  monthlySnapshots,
}) {
  const income = combinedMonthlyIncome(settings);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const freeCash = Math.max(0, income - burden);
  computeHouseholdMetrics({ settings, commitments, getEffectiveStatus, todayStr });

  const stability = computeFamilyStabilityScore({ settings, commitments, getEffectiveStatus });

  const overdueCount = commitments.filter((c) => getEffectiveStatus(c) === "overdue").length;
  const paidCount = commitments.filter((c) => getEffectiveStatus(c) === "paid").length;

  const sorted = [...(monthlySnapshots || [])].sort((a, b) => a.month.localeCompare(b.month));
  const lastSnap = sorted.at(-1);
  const prevSnap = sorted.at(-2);
  const pressureDelta =
    lastSnap?.pressureScore != null && prevSnap?.pressureScore != null
      ? Math.round((lastSnap.pressureScore - prevSnap.pressureScore) * 10) / 10
      : null;

  const cats = {};
  for (const c of commitments) {
    if (getEffectiveStatus(c) === "paid") continue;
    const cat = c.category || "Other";
    cats[cat] = (cats[cat] || 0) + Number(c.amount || 0);
  }
  const topCategory = Object.entries(cats).sort((a, b) => b[1] - a[1])[0] || null;

  return {
    month: format(parseISO(todayStr), "MMMM yyyy"),
    familyName: settings.familyName || settings.householdRoomName || "Our Family",
    income,
    burden,
    freeCash,
    burdenPct: income > 0 ? Math.round((burden / income) * 100) : null,
    stabilityScore: stability.score,
    stabilityTier: stability.tier,
    overdueCount,
    paidCount,
    commitmentCount: commitments.length,
    pressureDelta,
    pressureDirection:
      pressureDelta == null ? null : pressureDelta < -2 ? "down" : pressureDelta > 2 ? "up" : "stable",
    dependents: Number(settings.dependents || 0),
    topCategory,
  };
}
