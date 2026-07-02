/** Primary bottom nav — Home · Ledger · Add · Agreements · Insights */
export const NAV_ITEMS = [
  { to: "/", labelKey: "nav.home", icon: "house" },
  { to: "/ledger", labelKey: "nav.ledger", icon: "book-open", navGroup: "ledger" },
  { to: "/add", labelKey: "nav.add", icon: "+", fab: true },
  { to: "/agreements", labelKey: "nav.agreementsShort", icon: "note-pencil", navGroup: "agreements" },
  { to: "/insights", labelKey: "nav.insights", icon: "chart-line-up", navGroup: "insights" },
];

/** Only user mode — salaried individual finances. */
export const USER_MODE_IDS = ["salaried"];

/** Removed modes — migrated to salaried on load. */
export const REMOVED_USER_MODE_IDS = ["freelancer", "student", "business"];

const NAV_FULL = [
  "/",
  "/ledger",
  "/agreements",
  "/money",
  "/ledger/bills",
  "/money/lending",
  "/insights",
  "/insights/score",
  "/insights/cashflow",
  "/insights/networth",
  "/add",
  "/you",
  "/profile",
];

export const USER_MODES = [
  {
    id: "salaried",
    label: "Salaried",
    icon: "briefcase",
    description: "Salary, EMIs, and subscriptions for individual finances.",
    navPaths: NAV_FULL,
    showLending: true,
    showAffordabilityOnAdd: true,
  },
];

const LEGACY_MODES = {
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
