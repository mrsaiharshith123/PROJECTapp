import { getExperienceMode } from "../../constants/modeExperience.js";

/**
 * Home dashboard attention guidance — what to review first.
 * @param {object} ctx
 * @param {object} ctx.settings
 * @param {number} ctx.overdueCount
 * @param {number} ctx.stabilityScore
 */
export function getDashboardFocus(ctx) {
  const mode = getExperienceMode(ctx.settings);
  const overdue = ctx.overdueCount || 0;
  const score = ctx.stabilityScore ?? 0;

  if (overdue > 0) {
    return {
      tone: "warning",
      label: "Priority",
      message: `${overdue} overdue bill${overdue > 1 ? "s" : ""} — clearing these reduces pressure most directly.`,
    };
  }

  if (score < 45) {
    if (mode === "family") {
      return {
        tone: "warning",
        label: "Priority",
        message: "Household commitments are elevated — review shared expenses and school fees.",
      };
    }
    return {
      tone: "warning",
      label: "Priority",
      message: "Financial pressure is elevated — review dues and free cash in Financial pulse.",
    };
  }

  return {
    tone: "positive",
    label: "In order",
    message: "Review Financial pulse for recommendations; update bills when your situation changes.",
  };
}
