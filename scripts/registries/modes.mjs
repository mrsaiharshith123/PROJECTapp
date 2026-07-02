/**
 * Mode capability registry — which systems each experience may use.
 * Audits compare code imports against these boundaries (advisory).
 */

/** @type {Record<string, { label: string, engines: string[], sharedEngines: string[], isolatedUi: string[] }>} */
export const MODE_CAPABILITIES = {
  salaried: {
    label: "Salaried",
    engines: ["engines/survival.js", "engines/salaryBreakdown.js", "engines/momentumScore.js", "engines/emiConsolidation.js"],
    sharedEngines: ["engines/burden.js", "engines/forecast.js", "engines/pressureScore.js", "engines/commitmentInsights.js"],
    isolatedUi: [],
  },
  power: {
    label: "Power user (legacy)",
    engines: [],
    sharedEngines: ["engines/burden.js", "engines/survival.js", "engines/commitmentInsights.js"],
    isolatedUi: [],
  },
};

export const MODE_IDS = Object.keys(MODE_CAPABILITIES);

/** Files allowed to branch on user mode string literals */
export const MODE_LOGIC_ALLOWLIST = [
  "constants/modeExperience.js",
  "constants/userModes.js",
  "ui/features/dashboard/config/modeDashboardMetrics.js",
  "ui/features/home/DashboardTools.jsx",
  "ui/features/pages/ProfilePage.jsx",
  "ui/features/pages/HomePage.jsx",
];
