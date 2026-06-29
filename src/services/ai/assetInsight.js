import { getSupabaseClient } from "../supabase/auth.js";
import { getAssetCategory } from "../../constants/netWorth/wealthCategories.js";
import { analyzePropertyLocation } from "../../engines/propertyLocationIntel.js";

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
 * @param {object} [opts]
 * @param {ReturnType<typeof analyzePropertyLocation>} [opts.propertyIntel]
 */
export function buildAssetInsightPrompt(entry, t, opts = {}) {
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
    const prop = opts.propertyIntel;
    if (prop) {
      if (prop.cagr != null) lines.push(`CAGR since purchase: ${prop.cagr}%`);
      if (prop.realReturn != null) lines.push(`Real return (after ~${prop.inflationPct}% inflation): ${prop.realReturn}%`);
      if (prop.yearsHeld != null) lines.push(`Years held: ${prop.yearsHeld}`);
      if (prop.yieldPct != null) lines.push(`Est. rental yield: ${prop.yieldPct}%`);
      if (prop.vsBenchmark != null) lines.push(`vs city benchmark: ${prop.vsBenchmark}%`);
      lines.push(`Hold verdict: ${prop.holdVerdict}`);
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

  const depth = PROPERTY_IDS.has(entry.categoryId)
    ? `Write 4–6 sentences for an Indian property owner. Cover: (1) is it worth holding longer vs selling, (2) liquidity and emergency-access risks, (3) local infra / development outlook for this area (mention realistic project types — highways, industrial parks, RERA residential — not invented names), (4) inflation-adjusted return context, (5) one concrete next step (title check, rent comparison, or diversification). Be specific to the location and numbers given.`
    : `Be concise (2–3 sentences). Cover appreciation outlook, liquidity, and one practical action.`;

  return `Analyse this personal asset for an Indian household. ${depth} End with: Educational only — not financial advice.

${lines.join("\n")}`;
}

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {(key: string, params?: object) => string} t
 * @param {object} [settings]
 * @returns {Promise<{ insight: string, source: "ai" | "local" }>}
 */
export async function fetchAssetInsight(entry, t, settings = {}) {
  const propertyIntel = PROPERTY_IDS.has(entry.categoryId)
    ? analyzePropertyLocation(entry, settings)
    : null;
  const prompt = buildAssetInsightPrompt(entry, t, { propertyIntel });
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

  return buildLocalAssetInsight(entry, t, settings);
}

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {(key: string, params?: object) => string} t
 * @param {object} [settings]
 * @returns {{ insight: string, source: "local" }}
 */
function buildLocalAssetInsight(entry, t, settings = {}) {
  const cat = getAssetCategory(entry.categoryId);
  const categoryLabel = t(cat.labelKey);
  const value = Number(entry.value || 0);
  const valueLabel = value.toLocaleString("en-IN");

  if (PROPERTY_IDS.has(entry.categoryId)) {
    const prop = analyzePropertyLocation(entry, settings);
    if (prop?.hasPurchaseData) {
      const parts = [
        t(prop.holdLabelKey),
        t(prop.holdDetailKey),
        t(prop.developmentOutlookKey),
      ];
      for (const item of prop.narrativeKeys || []) {
        parts.push(t(item.id, item.params));
      }
      parts.push(t("netWorth.physical.insightDisclaimer"));
      return { insight: parts.filter(Boolean).join("\n\n"), source: "local" };
    }
    return { insight: t("netWorth.physical.insightLocalProperty"), source: "local" };
  }

  let insight = t("netWorth.physical.insightLocalGeneric", { category: categoryLabel, value: valueLabel });

  if (entry.categoryId === "gold") {
    insight = t("netWorth.physical.insightLocalGold");
  } else if (entry.categoryId === "vehicle") {
    insight = t("netWorth.physical.insightLocalVehicle");
  } else if (entry.categoryId === "business") {
    insight = t("netWorth.physical.insightLocalBusiness");
  }

  return { insight, source: "local" };
}
