import { getExperienceMode } from "../../constants/modeExperience.js";

/**
 * Lightweight app guide — calm copy, not a slideshow deck.
 * @typedef {{ id: string, title: string, body: string, tip?: string }} TourStep
 */

const COMMON = [
  {
    id: "welcome",
    title: "Welcome to CommitTrack",
    body: "This app helps you see financial pressure, stability, and what to do next — in plain language, not spreadsheets.",
    tip: "You can reopen this guide anytime from Profile → App guide.",
  },
  {
    id: "kpis",
    title: "Top numbers",
    body: "The row at the top is your quick read: what is due, cash left, and how stable this month looks. Tap the small ℹ on a label when you want a short explanation.",
  },
  {
    id: "pulse",
    title: "Financial pulse",
    body: "Open Summary, Pressure, and Tips here. Tips explain why something appeared — use “Why am I seeing this?” when you want transparency.",
  },
  {
    id: "add",
    title: "Add your world",
    body: "Bills, EMIs, and subscriptions feed every score. The more honest your list, the smarter the guidance.",
    tip: "Quick actions at the bottom jump to Add bill, Lending, or Profile.",
  },
  {
    id: "profile",
    title: "Profile & settings",
    body: "Income, mode, notifications, and account backup live in Profile. Change your experience anytime — we adapt the language to match.",
  },
];

const MODE_TAIL = {
  salaried: {
    id: "mode-salaried",
    title: "Your personal view",
    body: "We focus on paycheck pressure, EMIs, free cash, and emergency readiness. Start by adding your largest monthly commitments.",
  },
  family: {
    id: "mode-family",
    title: "Your household view",
    body: "We highlight shared bills, school fees, and household safety — so the whole home feels understandable, not just one salary.",
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
