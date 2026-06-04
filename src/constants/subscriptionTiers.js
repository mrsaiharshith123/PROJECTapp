export const SUBSCRIPTION_TIERS = {
  free: "free",
  pro: "pro",
  power: "power",
};

/** Pro-only feature ids (Power includes these too). */
export const PRO_FEATURES = new Set([
  "account_backup",
  "health_report",
  "forecast_12m",
  "advanced_pressure",
  "unlimited_lending",
]);

/** Power-only feature ids (on top of Pro). */
export const POWER_FEATURES = new Set([
  "multiple_profiles",
  "bond_advisor",
  "payoff_optimizer",
  "ca_share",
]);

export const PLAN_PRESENTATION = [
  {
    tier: SUBSCRIPTION_TIERS.free,
    title: "Free",
    price: "₹0",
    subtitle: "Local on your device",
    features: [
      "Salaried — single or family household",
      "All core bills, lending & dashboard tools",
      "JSON export & import (file backup)",
      "Works fully offline",
    ],
  },
  {
    tier: SUBSCRIPTION_TIERS.pro,
    title: "Pro",
    price: "₹99/mo · ₹799/yr",
    subtitle: "Everything in Free, plus",
    features: [
      "Account backup to Supabase (your private row)",
      "Turn backup on or off — local stays primary",
      "Annual financial health report",
      "12-month forecast & advanced pressure",
      "Unlimited lending entries",
    ],
  },
  {
    tier: SUBSCRIPTION_TIERS.power,
    title: "Power",
    price: "₹199/mo · ₹1499/yr",
    subtitle: "Everything in Pro, plus",
    features: [
      "Family member profiles (split bills)",
      "Bond advisor & payoff optimizer",
      "Share summary for your CA",
    ],
  },
];

export function hasPaidBackupTier(settings) {
  const tier = settings?.subscriptionTier || "free";
  return tier === SUBSCRIPTION_TIERS.pro || tier === SUBSCRIPTION_TIERS.power;
}

/**
 * @param {string} featureId
 * @param {string} [subscriptionTier]
 */
export function isFeatureUnlocked(featureId, subscriptionTier = "free") {
  const tier = subscriptionTier || "free";
  if (tier === "power") return true;
  if (POWER_FEATURES.has(featureId)) return false;
  if (PRO_FEATURES.has(featureId)) return tier === "pro";
  return true;
}
