import { parseISO } from "date-fns";

/** True when today matches the configured salary credit day (1–31). */
export function isSalaryCreditToday(todayStr, salaryCreditDay) {
  if (!todayStr || salaryCreditDay == null) return false;
  try {
    const dom = parseISO(`${todayStr}T12:00:00`).getDate();
    const day = Math.min(31, Math.max(1, Math.floor(Number(salaryCreditDay))));
    return dom === day;
  } catch {
    return false;
  }
}

/**
 * Apply salary-day auto-save rules once per calendar day.
 * @param {{
 *   rules?: { goalId: string | number, amount: number }[],
 *   goals?: object[],
 *   todayStr: string,
 *   salaryCreditDay?: number | null,
 *   lastRunDate?: string | null,
 * }} input
 */
export function planGoalAutoSave(input) {
  const todayStr = input.todayStr;
  const lastRun = input.lastRunDate || null;
  if (!isSalaryCreditToday(todayStr, input.salaryCreditDay)) {
    return { shouldRun: false, credits: [], nextLastRun: lastRun };
  }
  if (lastRun === todayStr) {
    return { shouldRun: false, credits: [], nextLastRun: lastRun };
  }

  const rules = Array.isArray(input.rules) ? input.rules : [];
  const goals = input.goals || [];
  const credits = [];

  for (const rule of rules) {
    const goalId = rule.goalId;
    const amount = Math.max(0, Number(rule.amount) || 0);
    if (!goalId || amount <= 0) continue;
    const goal = goals.find((g) => String(g.id) === String(goalId));
    if (!goal || goal.archived || goal.active === false) continue;
    if (!["save_amount", "education", "wedding"].includes(goal.type)) continue;
    credits.push({ goalId, amount, title: goal.title });
  }

  return {
    shouldRun: credits.length > 0,
    credits,
    nextLastRun: todayStr,
  };
}
