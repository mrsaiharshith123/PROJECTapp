/**
 * Mode capability registry — which systems each user mode may use.
 * Audits compare code imports against these boundaries (advisory).
 */

/** @type {Record<string, { label: string, engines: string[], sharedEngines: string[], isolatedUi: string[] }>} */
export const MODE_CAPABILITIES = {
  salaried: {
    label: "Salaried",
    engines: ["engines/survival.js", "engines/salaryBreakdown.js"],
    sharedEngines: ["engines/burden.js", "engines/forecast.js", "engines/pressureScore.js", "engines/intelligence.js"],
    isolatedUi: ["ui/features/dashboard/RoleDashboardPanel.jsx", "ui/features/dashboard/ModeIntelligenceSection.jsx"],
  },
  business: {
    label: "Business owner",
    engines: ["engines/modeBusiness.js"],
    sharedEngines: ["engines/burden.js", "engines/forecast.js", "engines/pressureScore.js"],
    isolatedUi: ["ui/features/dashboard/BusinessCashflowPanel.jsx"],
  },
  freelancer: {
    label: "Freelancer",
    engines: ["engines/modeFreelancer.js"],
    sharedEngines: ["engines/burden.js", "engines/survival.js", "engines/forecast.js"],
    isolatedUi: ["ui/features/dashboard/RoleDashboardPanel.jsx"],
  },
  family: {
    label: "Family household (legacy)",
    engines: ["engines/modeFamily.js", "engines/familyCalendar.js", "engines/householdPayer.js"],
    sharedEngines: ["engines/burden.js", "engines/survival.js"],
    isolatedUi: ["ui/features/dashboard/RoleDashboardPanel.jsx"],
  },
  student: {
    label: "Student",
    engines: ["engines/modeStudent.js"],
    sharedEngines: ["engines/burden.js", "engines/forecast.js"],
    isolatedUi: [],
  },
  power: {
    label: "Power user (legacy)",
    engines: [],
    sharedEngines: ["engines/burden.js", "engines/survival.js", "engines/intelligence.js", "engines/insightsExtended.js"],
    isolatedUi: [],
  },
};

export const MODE_IDS = Object.keys(MODE_CAPABILITIES);

/** Files allowed to branch on user mode string literals */
export const MODE_LOGIC_ALLOWLIST = [
  "constants/modeExperience.js",
  "constants/userModes.js",
  "ui/features/dashboard/ModeIntelligenceSection.jsx",
  "ui/features/dashboard/DashboardTools.jsx",
  "ui/features/dashboard/RoleDashboardPanel.jsx",
  "ui/features/pages/ProfilePage.jsx",
  "hooks/useStabilityIntel.js",
  "hooks/useCommitIntel.js",
  "engines/modeBusiness.js",
  "engines/modeFamily.js",
  "engines/modeFreelancer.js",
  "engines/modeStudent.js",
];
