import { getExperienceMode } from "../../constants/modeExperience.js";

/**
 * Home dashboard attention guidance — what to look at first.
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
      label: "Start here",
      message: `${overdue} overdue bill${overdue > 1 ? "s" : ""} — clearing these reduces pressure fastest.`,
    };
  }

  if (score < 45) {
    if (mode === "family") {
      return {
        tone: "warning",
        label: "Most important",
        message: "Household commitments are heavy — check shared expenses and school fees.",
      };
    }
    return {
      tone: "warning",
      label: "Most important",
      message: "Financial pressure is elevated — review dues and free cash in Financial pulse.",
    };
  }

  return {
    tone: "positive",
    label: "You're set up",
    message: "Glance at Financial pulse for tips; add bills as life changes.",
  };
}
