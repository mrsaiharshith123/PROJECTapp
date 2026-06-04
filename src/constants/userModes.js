/** Primary bottom nav — Home · Lending · Add · Bills · Profile (analytics via Home hero) */
export const NAV_ITEMS = [
  { to: "/", label: "Home", icon: "\u{1F3E0}" },
  { to: "/lending", label: "Lending", icon: "\u{1F91D}" },
  { to: "/add", label: "Add", icon: "+", fab: true },
  { to: "/commitments", label: "Bills", icon: "\u{1F4CB}" },
  { to: "/profile", label: "Profile", icon: "\u{1F464}" },
];

/** Only user mode — household uses salaried + householdScope. */
export const USER_MODE_IDS = ["salaried"];

/** Removed modes — migrated to salaried on load. */
export const REMOVED_USER_MODE_IDS = ["freelancer", "student", "business"];

const NAV_FULL = ["/", "/lending", "/add", "/commitments", "/profile", "/analytics"];

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
];

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
