/**
 * Feature registry — source of truth for product areas (governance + audits).
 * Update when adding a major feature; run npm run audit:features to validate wiring.
 */

/** @typedef {{ id: string, name: string, layer: string, ui: string[], engines: string[], hooks: string[], notes?: string }} FeatureDef */

/** @type {FeatureDef[]} */
export const FEATURES = [
  {
    id: "home-dashboard",
    name: "Home dashboard",
    layer: "product",
    ui: ["ui/features/pages/HomePage.jsx", "ui/features/dashboard/"],
    engines: ["engines/stabilityPlan.js", "engines/survival.js", "engines/burden.js", "engines/forecast.js"],
    hooks: ["hooks/useStabilityIntel.js", "hooks/useCommitIntel.js"],
  },
  {
    id: "commitments",
    name: "Bills & commitments",
    layer: "product",
    ui: ["ui/features/pages/CommitmentsPage.jsx", "ui/features/modals/BillDetailModal.jsx", "ui/features/modals/CommitmentEditModal.jsx"],
    engines: ["engines/reminders.js", "engines/forecastSeries.js"],
    hooks: ["hooks/useCommitIntel.js"],
  },
  {
    id: "lending",
    name: "Lending & trust",
    layer: "product",
    ui: ["ui/features/pages/LendingPage.jsx", "ui/features/lending/", "ui/features/modals/LendingDetailModal.jsx"],
    engines: ["engines/lendingTrust.js", "engines/lendingAgreement.js"],
    hooks: [],
  },
  {
    id: "net-worth",
    name: "Net worth & financial life intelligence",
    layer: "product",
    ui: [
      "ui/features/profile/hub/ProfileFinancialHero.jsx",
      "ui/features/profile/ProfileNetWorthSection.jsx",
      "ui/features/netWorth/",
    ],
    engines: [
      "engines/netWorth/core.js",
      "engines/netWorth/liquidity.js",
      "engines/netWorth/debtHealth.js",
      "engines/netWorth/lifeScore.js",
      "engines/netWorth/pressureWealth.js",
      "engines/netWorth/insights.js",
      "engines/netWorth/simulation.js",
    ],
    hooks: ["hooks/useNetWorthIntel.js"],
    notes: "Integrates commitments, lending, and wealth entries for life-position intelligence",
  },
  {
    id: "analytics",
    name: "Analytics",
    layer: "product",
    ui: ["ui/features/pages/AnalyticsPage.jsx", "ui/features/analytics/"],
    engines: ["engines/analyticsSeries.js", "engines/salaryBreakdown.js"],
    hooks: [],
  },
  {
    id: "calculators",
    name: "Dashboard calculators",
    layer: "product",
    ui: ["ui/features/dashboard/DashboardTools.jsx", "ui/features/tools/"],
    engines: [
      "engines/affordability.js",
      "engines/loanPayoffTiming.js",
      "engines/chitFund.js",
      "engines/bondAnalyzer.js",
      "engines/quickScenarios.js",
      "engines/incomeTaxEstimate.js",
      "engines/insuranceCalculator.js",
    ],
    hooks: [],
  },
  {
    id: "profile",
    name: "Profile & settings",
    layer: "product",
    ui: ["ui/features/pages/ProfilePage.jsx", "ui/features/profile/"],
    engines: [],
    hooks: [],
    notes: "Auth via services/supabase; optional cloud via services/sync",
  },
  {
    id: "notifications",
    name: "Notifications & reminders",
    layer: "platform",
    ui: ["ui/features/NotificationPanel.jsx"],
    engines: ["engines/notifications.js", "engines/reminders.js"],
    hooks: [],
  },
  {
    id: "onboarding",
    name: "Onboarding",
    layer: "platform",
    ui: ["ui/features/pages/OnboardingPage.jsx"],
    engines: [],
    hooks: [],
  },
  {
    id: "admin-intelligence",
    name: "Product intelligence (internal)",
    layer: "platform",
    ui: [
      "ui/features/pages/AdminPage.jsx",
      "ui/features/admin/",
      "ui/features/profile/hub/ProfileAdminEntry.jsx",
    ],
    engines: [],
    hooks: ["hooks/useAdminOverview.js"],
    notes: "Requires profiles.is_admin + Supabase admin migrations; see docs/architecture/AdminAnalytics.md",
  },
];

export const FEATURE_IDS = FEATURES.map((f) => f.id);
