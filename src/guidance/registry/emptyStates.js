import { getExperienceMode } from "../../constants/modeExperience.js";

/** @typedef {{ icon: string, title: string, hint: string, actionLabel?: string, actionPath?: string }} EmptyGuidance */

const BY_KEY = {
  "home-upcoming": {
    salaried: {
      icon: "📅",
      title: "No upcoming bills yet",
      hint: "Add your first commitment to see due dates and monthly pressure.",
      actionLabel: "Add a bill",
      actionPath: "/add",
    },
    family: {
      icon: "🏠",
      title: "Household calendar is clear",
      hint: "Add rent, school, insurance, or shared bills to forecast family stability.",
      actionLabel: "Add household bill",
      actionPath: "/add",
    },
  },
  "bills-list": {
    salaried: {
      icon: "📋",
      title: "Start tracking commitments",
      hint: "EMIs, rent, and subscriptions help CommitTrack explain pressure and free cash.",
      actionLabel: "Add first bill",
      actionPath: "/add",
    },
    family: {
      icon: "👨‍👩‍👧",
      title: "Add shared household bills",
      hint: "School fees and renewals improve household safety scores.",
      actionLabel: "Add bill",
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
      icon: "📋",
      title: "Nothing here yet",
      hint: "Add data to unlock insights.",
      actionLabel: "Get started",
      actionPath: "/add",
    };
  }
  return bucket[mode] || bucket.salaried;
}
