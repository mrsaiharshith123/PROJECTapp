/** Primary nav (4 items). Analytics via Home month card; calculators on Home dashboard. */
export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "\u{1F3E0}" },
  { to: "/commitments", label: "Bills", icon: "\u{1F4CB}" },
  { to: "/lending", label: "Money", icon: "\u{1F91D}" },
  { to: "/profile", label: "Profile", icon: "\u{1F464}" },
];

/** Modes users pick in onboarding / Profile (family via salaried + householdScope; power via subscription). */
export const USER_MODE_IDS = ["salaried", "business"];

/** Removed modes — still read from old saves, migrated to salaried on load. */
export const REMOVED_USER_MODE_IDS = ["freelancer", "student"];

/** Legacy ids still read from old saves — migrated on load. */
export const LEGACY_USER_MODE_IDS = ["family", "power", ...REMOVED_USER_MODE_IDS];

export const ALL_USER_MODE_IDS = [...USER_MODE_IDS, ...LEGACY_USER_MODE_IDS];

const NAV_FULL = ["/", "/commitments", "/lending", "/profile"];

export const USER_MODES = [
  {
    id: "salaried",
    label: "Salaried",
    emoji: "💼",
    description: "Salary, EMIs, and subscriptions — single or family household.",
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
];

/** Modes shown in onboarding / Profile dropdown. */
export const SELECTABLE_USER_MODES = USER_MODES;

const LEGACY_MODES = {
  family: {
    id: "family",
    label: "Family household",
    emoji: "👨‍👩‍👧",
    description: "Shared expenses and joint goals.",
    navPaths: NAV_FULL,
    showLending: true,
    showAffordabilityOnAdd: true,
  },
  power: {
    id: "power",
    label: "Power user",
    emoji: "⚡",
    description: "All features enabled.",
    navPaths: NAV_FULL,
    showLending: true,
    showAffordabilityOnAdd: true,
  },
};

export function getUserModeConfig(modeId) {
  if (REMOVED_USER_MODE_IDS.includes(modeId)) return USER_MODES[0];
  return USER_MODES.find((m) => m.id === modeId) || LEGACY_MODES[modeId] || USER_MODES[0];
}

export function navItemsForMode(modeId) {
  const cfg = getUserModeConfig(modeId);
  return NAV_ITEMS.filter((item) => cfg.navPaths.includes(item.to));
}
