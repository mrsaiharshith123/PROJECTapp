import { normalizeHouseholdMembers } from "./householdEntity.js";
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

/**
 * Household dependency graph — who carries burden vs who depends.
 */
export function analyzeFamilyDependency({ settings, commitments, getEffectiveStatus }) {
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
