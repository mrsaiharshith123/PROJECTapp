import { NAV_ITEMS } from "./nav.js";

/** Shared user mode config (Blueprint role-based OS). */
export const USER_MODE_IDS = ["salaried", "business", "freelancer", "family", "student", "power"];

const NAV_FULL = ["/", "/commitments", "/lending", "/profile"];
const NAV_NO_LENDING = ["/", "/commitments", "/profile"];

export const USER_MODES = [
  {
    id: "salaried",
    label: "Salaried",
    emoji: "💼",
    description: "EMIs, subscriptions, and salary pressure.",
    navPaths: NAV_FULL,
    showLending: true,
    showAffordabilityOnAdd: true,
  },
  {
    id: "business",
    label: "Business owner",
    emoji: "🏪",
    description: "Cashflow, receivables, and vendor payments.",
    navPaths: NAV_FULL,
    showLending: true,
    showAffordabilityOnAdd: false,
  },
  {
    id: "freelancer",
    label: "Freelancer / gig",
    emoji: "🎯",
    description: "Irregular income and flexible budgeting.",
    navPaths: NAV_FULL,
    showLending: true,
    showAffordabilityOnAdd: true,
  },
  {
    id: "family",
    label: "Family household",
    emoji: "👨‍👩‍👧",
    description: "Shared expenses and joint goals.",
    navPaths: NAV_FULL,
    showLending: true,
    showAffordabilityOnAdd: true,
  },
  {
    id: "student",
    label: "Student",
    emoji: "🎓",
    description: "Education costs and simple budgeting.",
    navPaths: NAV_NO_LENDING,
    showLending: false,
    showAffordabilityOnAdd: true,
  },
  {
    id: "power",
    label: "Power user",
    emoji: "⚡",
    description: "All features enabled.",
    navPaths: NAV_FULL,
    showLending: true,
    showAffordabilityOnAdd: true,
  },
];

export function getUserModeConfig(modeId) {
  return USER_MODES.find((m) => m.id === modeId) || USER_MODES[0];
}

export function navItemsForMode(modeId) {
  const cfg = getUserModeConfig(modeId);
  return NAV_ITEMS.filter((item) => cfg.navPaths.includes(item.to));
}
