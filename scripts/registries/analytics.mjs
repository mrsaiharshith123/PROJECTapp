/**
 * Analytics surface registry — charts and breakdown modules.
 */

export const ANALYTICS_MODULES = [
  { id: "analytics-page", ui: "ui/features/pages/AnalyticsPage.jsx", engine: "engines/analyticsSeries.js" },
  { id: "chart-panel", ui: "ui/features/analytics/AnalyticsChartPanel.jsx", engine: "engines/analyticsSeries.js" },
  { id: "paycheck-breakdown", ui: "ui/features/analytics/PaycheckBreakdown.jsx", engine: "engines/salaryBreakdown.js" },
  { id: "financial-pulse", ui: "ui/features/home/FinancialPulseCard.jsx", engine: "engines/pressureScore.js" },
  {
    id: "hero-month",
    ui: "ui/features/HeroMonthCard.jsx",
    engine: "utils/monthSpendSeries.js",
    also: ["utils/monthPaymentSummary.js", "utils/salarySpendBar.js"],
  },
];
