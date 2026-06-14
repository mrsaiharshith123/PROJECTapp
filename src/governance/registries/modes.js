/**
 * Mode capability registry — which systems each experience may use.
 * Audits compare code imports against these boundaries (advisory).
 */

/** @type {Record<string, { label: string, engines: string[], sharedEngines: string[], isolatedUi: string[] }>} */
export const MODE_CAPABILITIES = {
  salaried: {
    label: "Salaried",
    engines: ["engines/survival.js", "engines/salaryBreakdown.js"],
    sharedEngines: ["engines/burden.js", "engines/forecast.js", "engines/pressureScore.js", "engines/intelligence.js"],
    isolatedUi: ["ui/features/dashboard/ModeIntelligenceSection.jsx"],
  },
  family: {
    label: "Household (salaried + family scope)",
    engines: [
      "engines/modeFamily.js",
      "engines/familyCalendar.js",
      "engines/householdPayer.js",
      "engines/householdRoom.js",
      "engines/householdRoomLocal.js",
      "engines/householdSpendBreakdown.js",
    ],
    sharedEngines: ["engines/burden.js", "engines/survival.js"],
    isolatedUi: [
      "ui/features/dashboard/FamilyModeDashboard.jsx",
      "ui/features/profile/HouseholdHubSection.jsx",
      "ui/features/modals/HouseholdSetupModal.jsx",
    ],
  },
  power: {
    label: "Power user (legacy)",
    engines: [],
    sharedEngines: ["engines/burden.js", "engines/survival.js", "engines/intelligence.js", "engines/insightsExtended.js"],
    isolatedUi: ["ui/features/dashboard/ModeIntelligenceSection.jsx"],
  },
};

export const MODE_IDS = Object.keys(MODE_CAPABILITIES);

/** Files allowed to branch on user mode string literals */
export const MODE_LOGIC_ALLOWLIST = [
  "constants/modeExperience.js",
  "constants/userModes.js",
  "ui/features/dashboard/ModeIntelligenceSection.jsx",
  "ui/features/dashboard/config/modeDashboardMetrics.js",
  "ui/features/dashboard/DashboardTools.jsx",
  "ui/features/pages/ProfilePage.jsx",
  "hooks/useStabilityIntel.js",
  "hooks/useCommitIntel.js",
  "engines/modeFamily.js",
  "services/household/householdRoomService.js",
  "ui/features/profile/HouseholdHubSection.jsx",
  "ui/features/modals/HouseholdSetupModal.jsx",
  "ui/features/dashboard/HomeOverviewCard.jsx",
  "ui/features/profile/hub/ProfileFinancialHero.jsx",
];
