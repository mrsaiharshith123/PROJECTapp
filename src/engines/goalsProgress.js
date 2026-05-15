/**
 * @param {object} goal
 * @param {object} ctx { openRemainingSum, burdenRatio }
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
  if (goal.type === "save_amount") {
    const target = Math.max(1, Number(goal.targetAmount) || 1);
    const saved = Math.max(0, Number(ctx.savedAmountTowardGoal) || 0);
    return Math.min(1, saved / target);
  }
  return 0;
}

export function goalTypeLabel(type) {
  switch (type) {
    case "reduce_open_debt":
      return "Reduce open debt";
    case "income_ratio_cap":
      return "Cap commitment ratio";
    case "save_amount":
      return "Cash buffer / save target";
    default:
      return "Goal";
  }
}
