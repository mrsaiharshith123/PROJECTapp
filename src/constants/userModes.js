/** Primary bottom nav — Home · Money · Add · Plan · You */
export const NAV_ITEMS = [
  { to: "/", labelKey: "nav.home", icon: "house" },
  { to: "/money", labelKey: "nav.money", icon: "wallet", navGroup: "money" },
  { to: "/add", labelKey: "nav.add", icon: "+", fab: true },
  { to: "/plan", labelKey: "nav.plan", icon: "target", navGroup: "plan" },
  { to: "/profile", labelKey: "nav.you", icon: "user" },
];

/** Only user mode — household uses salaried + householdScope. */
export const USER_MODE_IDS = ["salaried"];

/** Removed modes — migrated to salaried on load. */
export const REMOVED_USER_MODE_IDS = ["freelancer", "student", "business"];

const NAV_FULL = ["/", "/money", "/money/bills", "/money/spends", "/money/lending", "/money/insights", "/money/wealth", "/add", "/plan", "/profile"];

export const USER_MODES = [
  {
    id: "salaried",
    label: "Salaried",
    icon: "briefcase",
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
    icon: "users-three",
    description: "Shared expenses and joint goals.",
    navPaths: NAV_FULL,
    showLending: true,
    showAffordabilityOnAdd: true,
  },
  power: {
    id: "power",
    label: "Power user",
    icon: "lightning",
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
