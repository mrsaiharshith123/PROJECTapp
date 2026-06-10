import { computeGoalProgress, goalTypeLabel } from "./goalsProgress.js";

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
