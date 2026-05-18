import { computeGoalProgress, goalTypeLabel } from "./goalsProgress.js";

/**
 * Whether multiple active goals fit current burden (family / salaried planning).
 */
export function analyzeGoalBalance(goals, ctx) {
  const active = (goals || []).filter((g) => g.active !== false && !g.archived);
  if (active.length === 0) {
    return { feasible: true, message: null, tensions: [], insights: [] };
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
      text: `You are tracking ${active.length} goals while monthly dues use a large share of income — progress may be slow on all fronts.`,
    });
  }

  if (education.length && wedding.length && burdenRatio > 0.45) {
    insights.push({
      id: "goal-edu-wedding",
      tone: "info",
      text: "Education and wedding/event goals together need a clear monthly slice — consider which comes first.",
    });
  }

  if (debtGoals.length && saveGoals.length && freeMoney < 8000) {
    insights.push({
      id: "goal-debt-save",
      tone: "warning",
      text: "Paying down debt and building savings at the same time is hard on thin free cash — pick a primary focus for now.",
    });
  }

  const progressRows = active.map((g) => ({
    name: g.name || goalTypeLabel(g.type),
    type: g.type,
    progress: Math.round(computeGoalProgress(g, ctx) * 100),
  }));

  const message =
    tensions.length > 0
      ? `Current finances may struggle to support ${tensions.join(", ")} at the same time.`
      : active.length >= 2 && burdenRatio > 0.5
        ? "Multiple goals are active — stagger targets so one big milestone does not starve the rest."
        : null;

  return {
    feasible: tensions.length === 0 && burdenRatio < 0.7,
    message,
    tensions,
    insights,
    progressRows,
  };
}
