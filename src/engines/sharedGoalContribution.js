import { differenceInMonths, parseISO } from "date-fns";

/** @param {object} goal @param {object} [settings] */
export function computeSharedGoalProgress(goal, settings = {}) {
  const total = Number(goal.targetAmount) || 0;
  const saved = Number(goal.savedAmount || 0) + Number(goal.autoSaved || 0);
  const selfAmt = Number(goal.memberContributions?.self || 0);
  const spouseAmt = Number(goal.memberContributions?.spouse || 0);
  const totalContrib = selfAmt + spouseAmt;
  const pct = total > 0 ? Math.min(100, Math.round((saved / total) * 100)) : 0;
  return {
    total,
    saved,
    pct,
    selfAmt,
    spouseAmt,
    totalContrib,
    remaining: Math.max(0, total - saved),
    selfName: settings?.displayName || "You",
    spouseName: settings?.spouseName || "Spouse",
  };
}

/** @param {object} goal @param {number} amount @param {"self"|"spouse"} whoPaid */
export function addContribution(goal, amount, whoPaid) {
  const current = goal.memberContributions || { self: 0, spouse: 0 };
  const key = whoPaid === "spouse" ? "spouse" : "self";
  return {
    ...current,
    [key]: (Number(current[key]) || 0) + Math.max(0, Number(amount) || 0),
  };
}

/** @param {object} goal @param {object} [settings] */
export function getContributionSuggestion(goal, settings = {}) {
  const { remaining } = computeSharedGoalProgress(goal, settings);
  if (!goal.targetDate || remaining <= 0) return null;
  const months = Math.max(1, differenceInMonths(parseISO(`${goal.targetDate}T12:00:00`), new Date()));
  return {
    total: Math.ceil(remaining / months),
    perPerson: Math.ceil(remaining / months / 2),
    months,
  };
}
