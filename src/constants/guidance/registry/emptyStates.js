import { getExperienceMode } from "../../modeExperience.js";

/** @typedef {{ icon: string, titleKey: string, hintKey: string, actionLabelKey?: string, actionPath?: string }} EmptyGuidance */

const BY_KEY = {
  "home-score": {
    salaried: {
      icon: "chart-line-up",
      titleKey: "empty.homeScore.title",
      hintKey: "empty.homeScore.hint",
      actionLabelKey: "empty.homeScore.action",
      actionPath: "/add",
    },
  },
  "home-upcoming": {
    salaried: {
      icon: "calendar",
      titleKey: "empty.upcoming.title",
      hintKey: "empty.upcoming.hint",
      actionLabelKey: "empty.upcoming.action",
      actionPath: "/add",
    },
  },
  "bills-list": {
    salaried: {
      icon: "clipboard-text",
      titleKey: "empty.billsList.salaried.title",
      hintKey: "empty.billsList.salaried.hint",
      actionLabelKey: "empty.billsList.salaried.action",
      actionPath: "/add",
    },
  },
};

/**
 * @param {string} key
 * @param {object} settings
 * @returns {EmptyGuidance}
 */
export function getEmptyStateGuidance(key, settings) {
  const mode = getExperienceMode(settings);
  const bucket = BY_KEY[key];
  if (!bucket) {
    return {
      icon: "clipboard-text",
      titleKey: "empty.fallback.title",
      hintKey: "empty.fallback.hint",
      actionLabelKey: "empty.fallback.action",
      actionPath: "/add",
    };
  }
  return bucket[mode] || bucket.salaried;
}
