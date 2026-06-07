import { getExperienceMode } from "../../constants/modeExperience.js";

/**
 * App guide — concise, professional copy.
 * @typedef {{ id: string, title: string, body: string, tip?: string }} TourStep
 */

const COMMON = [
  {
    id: "welcome",
    title: "Welcome to CommitTrack",
    body: "CommitTrack presents financial pressure, stability, and next steps in clear terms — without spreadsheets.",
    tip: "You may reopen this guide from Profile → App guide.",
  },
  {
    id: "kpis",
    title: "Summary figures",
    body: "The top row shows amounts due, cash remaining, and monthly stability. Select the ℹ icon beside a label for a brief explanation.",
  },
  {
    id: "pulse",
    title: "Financial pulse",
    body: "Review Summary, Pressure, and Tips here. Use “Why is this shown?” when you need the reason behind a recommendation.",
  },
  {
    id: "add",
    title: "Enter your obligations",
    body: "Bills, EMIs, and subscriptions feed each score. Complete and accurate entries improve the quality of guidance.",
    tip: "Quick actions navigate to Add bill, Lending, or Profile.",
  },
  {
    id: "profile",
    title: "Profile and settings",
    body: "Income, mode, notifications, and account backup are managed in Profile. You may change your experience at any time.",
  },
];

const MODE_TAIL = {
  salaried: {
    id: "mode-salaried",
    title: "Personal view",
    body: "The dashboard emphasizes paycheck pressure, EMIs, free cash, and emergency readiness. Begin with your largest monthly commitments.",
  },
  family: {
    id: "mode-family",
    title: "Household view",
    body: "The dashboard highlights shared bills, school fees, and household safety across all income sources.",
  },
};

/**
 * @param {object} settings
 * @returns {TourStep[]}
 */
export function getAppTourSteps(settings) {
  const mode = getExperienceMode(settings);
  const tail = MODE_TAIL[mode] || MODE_TAIL.salaried;
  const steps = [...COMMON];
  steps.splice(3, 0, tail);
  return steps;
}
