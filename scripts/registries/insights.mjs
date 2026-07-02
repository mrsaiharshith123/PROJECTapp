/**
 * Insight & severity registry — canonical insight producers and tone levels.
 */

export const INSIGHT_SEVERITIES = ["critical", "warning", "normal", "low", "info", "positive"];

/** Primary engines that emit user-facing financial insights */
export const INSIGHT_PRODUCERS = [
  { id: "commitment-insights", path: "engines/commitmentInsights.js", domain: "core" },
  { id: "pressure-intelligence", path: "engines/pressureIntelligence.js", domain: "pressure" },
  { id: "stability-narrative", path: "engines/stabilityNarrative.js", domain: "forecast" },
  { id: "subscription-leak", path: "engines/subscriptionLeak.js", domain: "subscriptions" },
  { id: "financial-health", path: "engines/financialHealth.js", domain: "health" },
  { id: "notifications", path: "engines/notifications.js", domain: "reminders" },
  { id: "transaction-intel", path: "engines/transactionIntel.js", domain: "transactions" },
];

export const INSIGHT_TONES = ["critical", "warning", "caution", "neutral", "positive"];
