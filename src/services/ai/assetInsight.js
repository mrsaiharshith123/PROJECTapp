import { getSupabaseClient } from "../supabase/auth.js";
import { getAssetCategory } from "../../constants/netWorth/wealthCategories.js";

const ASSET_INSIGHT_FUNCTION = "asset-insight";

/** Category ids treated as physical / tangible assets. */
export const PHYSICAL_ASSET_TYPES = [
  "property",
  "property_residential",
  "property_land",
  "property_commercial",
  "vehicle",
  "gold",
  "business",
];

const PROPERTY_IDS = new Set([
  "property",
  "property_residential",
  "property_land",
  "property_commercial",
]);

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {(key: string) => string} t
 */
export function buildAssetInsightPrompt(entry, t) {
  const cat = getAssetCategory(entry.categoryId);
  const categoryLabel = t(cat.labelKey);
  const lines = [
    `Asset type: ${categoryLabel}`,
    `Name: ${entry.name}`,
    `Current value: ₹${Number(entry.value || 0).toLocaleString("en-IN")}`,
  ];

  if (entry.purchaseYear) lines.push(`Purchase year: ${entry.purchaseYear}`);
  if (entry.purchasePrice) {
    lines.push(`Purchase price: ₹${Number(entry.purchasePrice).toLocaleString("en-IN")}`);
  }
  if (entry.location) lines.push(`Location: ${entry.location}`);

  if (PROPERTY_IDS.has(entry.categoryId)) {
    if (entry.areaMeasure && entry.areaUnit) {
      lines.push(`Area: ${entry.areaMeasure} ${entry.areaUnit}`);
    }
  }

  if (entry.categoryId === "vehicle") {
    if (entry.vehicleMake) lines.push(`Make / model: ${entry.vehicleMake}`);
    if (entry.vehicleYear) lines.push(`Model year: ${entry.vehicleYear}`);
  }

  if (entry.categoryId === "gold") {
    if (entry.weightGrams) lines.push(`Weight: ${entry.weightGrams} g`);
    if (entry.purityKarat) lines.push(`Purity: ${entry.purityKarat}K`);
  }

  return `Analyse this personal asset for an Indian household. Be concise (2–3 sentences). Cover appreciation outlook, liquidity, and one practical action. End with: Educational only — not financial advice.

${lines.join("\n")}`;
}

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {(key: string) => string} t
 * @returns {Promise<{ insight: string, source: "ai" | "local" }>}
 */
export async function fetchAssetInsight(entry, t) {
  const prompt = buildAssetInsightPrompt(entry, t);
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke(ASSET_INSIGHT_FUNCTION, {
        body: { entry, prompt },
      });
      if (!error && data?.insight) {
        return { insight: String(data.insight), source: "ai" };
      }
    } catch {
      // fall through to local insight
    }
  }

  return buildLocalAssetInsight(entry, t);
}

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {(key: string, params?: object) => string} t
 * @returns {{ insight: string, source: "local" }}
 */
function buildLocalAssetInsight(entry, t) {
  const cat = getAssetCategory(entry.categoryId);
  const categoryLabel = t(cat.labelKey);
  const value = Number(entry.value || 0);
  const valueLabel = value.toLocaleString("en-IN");

  let insight = t("netWorth.physical.insightLocalGeneric", { category: categoryLabel, value: valueLabel });

  if (entry.categoryId === "gold") {
    insight = t("netWorth.physical.insightLocalGold");
  } else if (entry.categoryId === "vehicle") {
    insight = t("netWorth.physical.insightLocalVehicle");
  } else if (PROPERTY_IDS.has(entry.categoryId)) {
    insight = t("netWorth.physical.insightLocalProperty");
  } else if (entry.categoryId === "business") {
    insight = t("netWorth.physical.insightLocalBusiness");
  }

  return { insight, source: "local" };
}
