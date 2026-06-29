/** @typedef {'liquid' | 'semi-liquid' | 'locked' | 'high-risk'} LiquidityTier */

/** @typedef {{ id: string, labelKey: string, icon: string, tier: LiquidityTier, indian?: boolean }} WealthCategoryDef */

/** @type {WealthCategoryDef[]} */
export const ASSET_CATEGORIES = [
  { id: "bank", labelKey: "netWorth.asset.bank", icon: "bank", tier: "liquid" },
  { id: "cash", labelKey: "netWorth.asset.cash", icon: "wallet", tier: "liquid" },
  { id: "savings", labelKey: "netWorth.asset.savings", icon: "piggy-bank", tier: "liquid" },
  { id: "emergency", labelKey: "netWorth.asset.emergency", icon: "shield-check", tier: "liquid" },
  { id: "sip", labelKey: "netWorth.asset.sip", icon: "chart-line-up", tier: "semi-liquid", indian: true },
  { id: "stocks", labelKey: "netWorth.asset.stocks", icon: "chart-line", tier: "semi-liquid" },
  { id: "mutual_fund", labelKey: "netWorth.asset.mutualFund", icon: "chart-pie-slice", tier: "semi-liquid", indian: true },
  { id: "fd", labelKey: "netWorth.asset.fd", icon: "vault", tier: "locked", indian: true },
  { id: "rd", labelKey: "netWorth.asset.rd", icon: "calendar-check", tier: "locked", indian: true },
  { id: "gold", labelKey: "netWorth.asset.gold", icon: "coins", tier: "semi-liquid", indian: true },
  { id: "crypto", labelKey: "netWorth.asset.crypto", icon: "currency-btc", tier: "high-risk" },
  { id: "property_residential", labelKey: "netWorth.asset.propertyResidential", icon: "house", tier: "locked", indian: true },
  { id: "property_land", labelKey: "netWorth.asset.propertyLand", icon: "push-pin", tier: "locked", indian: true },
  { id: "property_commercial", labelKey: "netWorth.asset.propertyCommercial", icon: "buildings", tier: "locked", indian: true },
  { id: "vehicle", labelKey: "netWorth.asset.vehicle", icon: "car", tier: "locked" },
  { id: "pf_epf", labelKey: "netWorth.asset.pfEpf", icon: "briefcase", tier: "locked", indian: true },
  { id: "business", labelKey: "netWorth.asset.business", icon: "buildings", tier: "locked" },
  { id: "insurance", labelKey: "netWorth.asset.insurance", icon: "umbrella", tier: "locked", indian: true },
  { id: "other", labelKey: "netWorth.asset.other", icon: "package", tier: "semi-liquid" },
];

/** @type {WealthCategoryDef[]} */
export const LIABILITY_CATEGORIES = [
  { id: "home_loan", labelKey: "netWorth.liability.homeLoan", icon: "house", tier: "locked", indian: true },
  { id: "personal_loan", labelKey: "netWorth.liability.personalLoan", icon: "user", tier: "liquid" },
  { id: "credit_card", labelKey: "netWorth.liability.creditCard", icon: "credit-card", tier: "liquid" },
  { id: "bnpl", labelKey: "netWorth.liability.bnpl", icon: "shopping-cart", tier: "liquid" },
  { id: "vehicle_loan", labelKey: "netWorth.liability.vehicleLoan", icon: "car", tier: "locked" },
  { id: "education_loan", labelKey: "netWorth.liability.educationLoan", icon: "graduation-cap", tier: "locked", indian: true },
  { id: "family_debt", labelKey: "netWorth.liability.familyDebt", icon: "users-three", tier: "liquid", indian: true },
  { id: "borrowed", labelKey: "netWorth.liability.borrowed", icon: "handshake", tier: "liquid", indian: true },
  { id: "business_debt", labelKey: "netWorth.liability.businessDebt", icon: "buildings", tier: "locked" },
  { id: "other", labelKey: "netWorth.liability.other", icon: "minus-circle", tier: "liquid" },
];

/** Asset categories shown under Instruments (not core Assets tab). */
export const INSTRUMENT_CATEGORY_IDS = new Set([
  "insurance",
  "sip",
  "fd",
  "rd",
  "pf_epf",
  "stocks",
  "mutual_fund",
]);

/** Asset categories hidden from salaried add-asset picker (legacy entries still resolve). */
export const SALARIED_EXCLUDED_ASSET_IDS = new Set(["business", "crypto"]);

export const CORE_ASSET_CATEGORIES = ASSET_CATEGORIES.filter(
  (c) => !INSTRUMENT_CATEGORY_IDS.has(c.id) && !SALARIED_EXCLUDED_ASSET_IDS.has(c.id),
);

export const INSTRUMENT_CATEGORIES = ASSET_CATEGORIES.filter((c) => INSTRUMENT_CATEGORY_IDS.has(c.id));

const ASSET_MAP = new Map(ASSET_CATEGORIES.map((c) => [c.id, c]));
const LIABILITY_MAP = new Map(LIABILITY_CATEGORIES.map((c) => [c.id, c]));

/** @param {string} id */
export function getAssetCategory(id) {
  const resolved = id === "property" ? "property_residential" : id;
  return ASSET_MAP.get(resolved) || ASSET_CATEGORIES[ASSET_CATEGORIES.length - 1];
}

/** @param {string} id */
export function getLiabilityCategory(id) {
  return LIABILITY_MAP.get(id) || LIABILITY_CATEGORIES[LIABILITY_CATEGORIES.length - 1];
}

/** @param {LiquidityTier} tier */
export function liquidityTierWeight(tier) {
  switch (tier) {
    case "liquid":
      return 1;
    case "semi-liquid":
      return 0.65;
    case "locked":
      return 0.15;
    case "high-risk":
      return 0.45;
    default:
      return 0.5;
  }
}
