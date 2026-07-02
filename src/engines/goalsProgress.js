import { differenceInCalendarDays, parseISO } from "date-fns";

/**
 * @param {object} goal
 * @param {object} ctx { openRemainingSum, burdenRatio, savedAmountTowardGoal? }
 */
export function computeGoalProgress(goal, ctx) {
  const open = Math.max(0, Number(ctx.openRemainingSum) || 0);
  const ratio = ctx.burdenRatio ?? 0;

  if (goal.type === "reduce_open_debt") {
    const base = Math.max(1, Number(goal.baselineOpenRemaining) || open);
    const target = Math.max(1, Number(goal.targetReduction) || 1);
    const reduced = Math.max(0, base - open);
    return Math.min(1, reduced / target);
  }
  if (goal.type === "income_ratio_cap") {
    const cap = Math.max(0.05, Number(goal.targetRatio) || 0.5);
    if (ratio <= cap) return 1;
    return Math.max(0, 1 - (ratio - cap) / Math.max(0.01, ratio));
  }
  if (goal.type === "save_amount" || goal.type === "education" || goal.type === "wedding") {
    const target = Math.max(1, Number(goal.targetAmount) || 1);
    const saved = Math.max(0, Number(ctx.savedAmountTowardGoal) || 0);
    return Math.min(1, saved / target);
  }
  return 0;
}

/**
 * Rich goal status for UI — pace, target date, i18n status key.
 * @param {object} goal
 * @param {object} ctx
 * @param {string} [todayStr] YYYY-MM-DD
 */
export function computeGoalIntel(goal, ctx, todayStr = "") {
  const progress = computeGoalProgress(goal, ctx);
  const progressPercent = Math.round(progress * 100);

  let status = "on_track";
  if (progress >= 1) status = "complete";
  else if (progress >= 0.85) status = "near_complete";
  else if (progress < 0.25) status = "behind";
  else if (progress < 0.5) status = "slow";

  let daysRemaining = null;
  let requiredMonthlyPace = null;
  if (goal.targetDate && todayStr && (goal.type === "save_amount" || goal.type === "education" || goal.type === "wedding")) {
    try {
      daysRemaining = differenceInCalendarDays(
        parseISO(`${goal.targetDate}T12:00:00`),
        parseISO(`${todayStr}T12:00:00`),
      );
      if (daysRemaining > 0 && progress < 1) {
        const target = Math.max(1, Number(goal.targetAmount) || 1);
        const saved = Math.max(0, Number(ctx.savedAmountTowardGoal) || 0);
        const gap = Math.max(0, target - saved);
        const monthsLeft = Math.max(1, daysRemaining / 30);
        requiredMonthlyPace = Math.ceil(gap / monthsLeft);
        if (progress < 0.5 && daysRemaining < 90) status = "behind";
      }
    } catch {
      /* ignore bad dates */
    }
  }

  return {
    progress,
    progressPercent,
    status,
    statusKey: `goals.status.${status}`,
    daysRemaining,
    requiredMonthlyPace,
  };
}

export function goalTypeLabel(type) {
  switch (type) {
    case "reduce_open_debt":
      return "Reduce open debt";
    case "income_ratio_cap":
      return "Cap commitment ratio";
    case "save_amount":
      return "Cash buffer / save target";
    case "education":
      return "Education fund";
    case "wedding":
      return "Wedding / event fund";
    default:
      return "Goal";
  }
}

/**
 * Whether multiple active goals fit current burden (family / salaried planning).
 */
export function analyzeGoalBalance(goals, ctx) {
  const active = (goals || []).filter((g) => g.active !== false && !g.archived);
  if (active.length === 0) {
    return { feasible: true, messageKey: null, messageParams: null, tensions: [], insights: [] };
  }

  const burdenRatio = ctx.burdenRatio ?? 0;
  const freeMoney = ctx.freeMoney ?? 0;
  const tensions = [];
  const insights = [];

  const education = active.filter((g) => g.type === "education");
  const wedding = active.filter((g) => g.type === "wedding");
  const saveGoals = active.filter((g) => g.type === "save_amount");
  const debtGoals = active.filter((g) => g.type === "reduce_open_debt");

  if (active.length >= 3 && burdenRatio > 0.55) {
    tensions.push("home EMI", "savings goals", "other targets");
    insights.push({
      id: "goal-overlap",
      tone: "warning",
      params: { count: active.length },
    });
  }

  if (education.length && wedding.length && burdenRatio > 0.45) {
    insights.push({
      id: "goal-edu-wedding",
      tone: "info",
    });
  }

  if (debtGoals.length && saveGoals.length && freeMoney < 8000) {
    insights.push({
      id: "goal-debt-save",
      tone: "warning",
    });
  }

  const progressRows = active.map((g) => ({
    name: g.name || goalTypeLabel(g.type),
    type: g.type,
    progress: Math.round(computeGoalProgress(g, ctx) * 100),
  }));

  let messageKey = null;
  /** @type {Record<string, unknown> | null} */
  let messageParams = null;
  if (tensions.length > 0) {
    messageKey = "stability.goalBalance.tensions";
    messageParams = { tensions: tensions.join(", ") };
  } else if (active.length >= 2 && burdenRatio > 0.5) {
    messageKey = "stability.goalBalance.stagger";
  }

  return {
    feasible: tensions.length === 0 && burdenRatio < 0.7,
    messageKey,
    messageParams,
    tensions,
    insights,
    progressRows,
  };
}
