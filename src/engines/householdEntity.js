import { totalMonthlyBurden } from "./burden.js";
import { combinedMonthlyIncome } from "../utils/combinedIncome.js";

/** @typedef {'owner'|'spouse'|'dependent'|'parent'|'contributor'} HouseholdRole */

const DEFAULT_MEMBERS = [
  { id: "owner", label: "You", role: "owner", incomeShare: 1, permission: "shared_edit" },
];

/**
 * @param {unknown} raw
 */
export function normalizeHouseholdMembers(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_MEMBERS];

  const roles = new Set(["owner", "spouse", "dependent", "parent", "contributor"]);
  const perms = new Set(["read_only", "shared_edit", "private"]);

  return raw
    .map((m, i) => ({
      id: String(m?.id || `member-${i}`).slice(0, 32),
      label: String(m?.label || "Member").slice(0, 40),
      role: roles.has(m?.role) ? m.role : "contributor",
      incomeShare: Math.max(0, Math.min(1, Number(m?.incomeShare) || 0)),
      permission: perms.has(m?.permission) ? m.permission : "shared_edit",
    }))
    .filter((m) => m.id);
}

/**
 * Combined household metrics from settings + commitments.
 */
export function computeHouseholdMetrics({
  settings,
  commitments,
  getEffectiveStatus,
  lendings: _lendings = [],
  todayStr: _todayStr = "",
}) {
  const members = normalizeHouseholdMembers(settings?.householdMembers);
  const income = combinedMonthlyIncome(settings);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const freeCash = income - burden;
  const dependencyRatio =
    members.filter((m) => m.role === "dependent" || m.role === "parent").length /
    Math.max(1, members.length);

  return {
    members,
    memberCount: members.length,
    combinedIncome: income,
    combinedBurden: burden,
    combinedFreeCash: freeCash,
    burdenRatio: income > 0 ? Math.round((burden / income) * 100) : null,
    dependencyRatio: Math.round(dependencyRatio * 100) / 100,
    stabilityLabel:
      freeCash >= income * 0.15 ? "stable" : freeCash >= 0 ? "tight" : "strained",
  };
}
