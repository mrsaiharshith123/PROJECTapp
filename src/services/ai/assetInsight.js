import { getSupabaseClient } from "../supabase/auth.js";
import { getAssetCategory } from "../../constants/netWorth/wealthCategories.js";
import { analyzePropertyLocation } from "../../engines/propertyLocationIntel.js";
import { expandMilestonesToSeries } from "../../utils/netWorth/propertyValueHistory.js";

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

function wantsLiveMarketData(entry) {
  return PROPERTY_IDS.has(entry.categoryId);
}

function isLiveMarketSuccess(data) {
  if (!data?.structured || !data?.marketData) return false;
  if (PROPERTY_IDS.has(data.categoryId)) {
    const md = data.marketData;
    const rate = md.marketRate;
    return Boolean(
      md.impliedMarketValue ||
        rate?.perSqyd != null ||
        rate?.perSqft != null,
    );
  }
  return true;
}

/**
 * @param {(key: string, params?: object) => string} t
 * @param {{ errorCode?: string, errorMessage?: string }} result
 */
export function resolveAssetInsightError(t, result) {
  const code = result.errorCode || "";
  if (code === "ai_not_configured") return t("wealthDetail.market.failedNotConfigured");
  if (code === "unauthorized") return t("wealthDetail.market.failedAuth");
  if (code === "gemini_401" || code === "gemini_403") return t("wealthDetail.market.failedAuthKey");
  if (code === "no_market_rate" || code === "unstructured_response") {
    return t("wealthDetail.market.failedPartial");
  }
  if (code.startsWith("gemini_404") || code.includes("404")) {
    return t("wealthDetail.market.failedModel", { code: "404" });
  }
  if (code.startsWith("gemini_")) {
    const status = code.replace("gemini_", "").split(":")[0] || "error";
    return t("wealthDetail.market.failedModel", { code: status });
  }
  if (result.errorMessage) return result.errorMessage;
  return t("wealthDetail.market.failed");
}

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
 * @param {object} [opts]
 * @param {boolean} [opts.includeValueHistory] — bundle chart milestones in same Gemini call (property only)
 * @returns {Promise<{
 *   insight: string | null,
 *   marketData: object | null,
 *   structured: boolean,
 *   source: "ai" | "local" | "error",
 *   errorCode?: string,
 *   errorMessage?: string
 * }>}
 */
export async function fetchAssetInsight(entry, t, settings = {}, opts = {}) {
  const liveMarket = wantsLiveMarketData(entry);
  const supabase = getSupabaseClient();
  const wantHistory =
    Boolean(opts.includeValueHistory) && PROPERTY_IDS.has(entry.categoryId);

  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke(ASSET_INSIGHT_FUNCTION, {
        body: propertyInsightBody(entry, {
          includeValueHistory: wantHistory || undefined,
        }),
      });

      const payload = data && typeof data === "object" ? data : {};

      if (payload.error) {
        console.warn("[assetInsight] edge error:", payload.error, payload.message || "");
        return {
          insight: null,
          marketData: null,
          structured: false,
          source: "error",
          errorCode: String(payload.error),
          errorMessage: payload.message ? String(payload.message) : undefined,
        };
      }

      if (!error && payload.insight != null) {
        const result = {
          insight: String(payload.insight),
          marketData: payload.marketData ?? null,
          milestones: Array.isArray(payload.milestones) ? payload.milestones : null,
          structured: Boolean(payload.structured),
          source: /** @type {const} */ ("ai"),
          categoryId: entry.categoryId,
        };
        if (!liveMarket || isLiveMarketSuccess(result)) {
          return result;
        }
        return {
          insight: null,
          marketData: null,
          structured: false,
          source: "error",
          errorCode: "no_market_rate",
        };
      }

      if (error) {
        console.warn("[assetInsight] invoke transport error:", error);
        return {
          insight: null,
          marketData: null,
          structured: false,
          source: "error",
          errorCode: "invoke_failed",
          errorMessage: error.message || undefined,
        };
      }
    } catch (e) {
      console.warn("[assetInsight] invoke failed:", e);
      return {
        insight: null,
        marketData: null,
        structured: false,
        source: "error",
        errorCode: "invoke_failed",
        errorMessage: e instanceof Error ? e.message : String(e),
      };
    }
  } else if (liveMarket) {
    return {
      insight: null,
      marketData: null,
      structured: false,
      source: "error",
      errorCode: "unauthorized",
    };
  }

  if (liveMarket) {
    return {
      insight: null,
      marketData: null,
      structured: false,
      source: "error",
      errorCode: "invoke_failed",
    };
  }

  const local = buildLocalAssetInsight(entry, t, settings);
  return { ...local, marketData: null, structured: false };
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
        t(prop.developmentOutlookKey, {
          area: prop.outlookArea || t("wealthDetail.property.outlookAreaFallback"),
        }),
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

function parsePropertyMarketPayload(payload, fields) {
  const md = payload.marketData;
  if (!md || typeof md !== "object") {
    return { ok: false, errorCode: "no_market_rate" };
  }

  const rateObj = md.marketRate || {};
  let perSqyd = rateObj.perSqyd != null ? Number(rateObj.perSqyd) : null;
  const perSqft = rateObj.perSqft != null ? Number(rateObj.perSqft) : null;
  if ((!perSqyd || Number.isNaN(perSqyd)) && perSqft && !Number.isNaN(perSqft)) {
    perSqyd = perSqft * 9;
  }

  const area = Number(fields.areaMeasure) || 0;
  const value =
    md.impliedMarketValue != null
      ? Number(md.impliedMarketValue)
      : perSqyd && area > 0
        ? Math.round(perSqyd * area)
        : null;

  if (!value || value <= 0 || !perSqyd || Number.isNaN(perSqyd)) {
    return { ok: false, errorCode: "no_market_rate" };
  }

  return {
    ok: true,
    value,
    marketRatePerSqyd: Math.round(perSqyd),
    annualGrowthPct: md.trend?.annualGrowthPct ?? null,
    dataSource: rateObj.dataSource ? String(rateObj.dataSource) : null,
    marketData: md,
    milestones: Array.isArray(payload.milestones) ? payload.milestones : null,
  };
}

function propertyInsightBody(fields, extra = {}) {
  return {
    categoryId: fields.categoryId,
    name: fields.name || "",
    location: fields.location || "",
    latitude: fields.latitude ?? null,
    longitude: fields.longitude ?? null,
    purchaseYear: fields.purchaseYear ?? null,
    purchaseMonth: fields.purchaseMonth ?? null,
    purchasePrice: fields.purchasePrice ?? null,
    purchaseRatePerUnit: fields.purchaseRatePerUnit ?? null,
    currentValue: fields.currentValue ?? fields.value ?? 0,
    marketRatePerSqyd: fields.marketRatePerSqyd ?? null,
    areaMeasure: fields.areaMeasure ?? null,
    areaUnit: fields.areaUnit || "sqyd",
    ...extra,
  };
}
/**
 * Fetch live property value (asset-insight edge function).
 * @param {object} fields
 * @returns {Promise<{
 *   ok: boolean,
 *   value?: number,
 *   marketRatePerSqyd?: number,
 *   annualGrowthPct?: number | null,
 *   dataSource?: string | null,
 *   marketData?: object,
 *   errorCode?: string,
 *   errorMessage?: string
 * }>}
 */
export async function fetchPropertyLiveValue(fields) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { ok: false, errorCode: "unauthorized" };
  }

  try {
    const { data, error } = await supabase.functions.invoke(ASSET_INSIGHT_FUNCTION, {
      body: propertyInsightBody(fields),
    });

    const payload = data && typeof data === "object" ? data : {};
    if (payload.error || error) {
      return {
        ok: false,
        errorCode: String(payload.error || "invoke_failed"),
        errorMessage: payload.message ? String(payload.message) : error?.message,
      };
    }

    return parsePropertyMarketPayload(payload, fields);
  } catch (e) {
    return {
      ok: false,
      errorCode: "invoke_failed",
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * One Gemini call: live market rate + value history milestones (save flow).
 * @param {object} fields
 * @returns {Promise<{
 *   ok: boolean,
 *   value?: number,
 *   marketRatePerSqyd?: number,
 *   annualGrowthPct?: number | null,
 *   dataSource?: string | null,
 *   series?: { year: number, value: number, ratePerSqyd: number }[],
 *   errorCode?: string,
 *   errorMessage?: string
 * }>}
 */
export async function fetchPropertyAiBundle(fields) {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, errorCode: "unauthorized" };

  try {
    const { data, error } = await supabase.functions.invoke(ASSET_INSIGHT_FUNCTION, {
      body: propertyInsightBody(fields, { analysisMode: "property_bundle" }),
    });

    const payload = data && typeof data === "object" ? data : {};
    if (payload.error || error) {
      return {
        ok: false,
        errorCode: String(payload.error || "invoke_failed"),
        errorMessage: payload.message ? String(payload.message) : error?.message,
      };
    }

    const parsed = parsePropertyMarketPayload(payload, fields);
    if (!parsed.ok) return parsed;

    const purchaseYear = Number(fields.purchaseYear);
    const area = Number(fields.areaMeasure) || 0;
    const currentYear = new Date().getFullYear();
    const milestones = parsed.milestones;

    if (
      purchaseYear > 0 &&
      purchaseYear < currentYear &&
      area > 0 &&
      Array.isArray(milestones) &&
      milestones.length >= 2
    ) {
      const series = expandMilestonesToSeries(
        milestones,
        area,
        purchaseYear,
        currentYear,
        Number(fields.purchasePrice) || 0,
      );
      if (series.length >= 2) {
        return { ...parsed, series };
      }
    }

    return parsed;
  } catch (e) {
    return {
      ok: false,
      errorCode: "invoke_failed",
      errorMessage: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Fetch year-by-year property value milestones from Gemini and expand to a chart series.
 * @param {object} fields
 * @returns {Promise<{
 *   ok: boolean,
 *   series?: { year: number, value: number, ratePerSqyd: number }[],
 *   summary?: string,
 *   errorCode?: string
 * }>}
 */
export async function fetchPropertyValueHistory(fields) {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, errorCode: "unauthorized" };

  const purchaseYear = Number(fields.purchaseYear);
  const area = Number(fields.areaMeasure) || 0;
  const currentYear = new Date().getFullYear();
  if (!purchaseYear || purchaseYear >= currentYear || !area) {
    return { ok: false, errorCode: "invalid_input" };
  }

  try {
    const { data, error } = await supabase.functions.invoke(ASSET_INSIGHT_FUNCTION, {
      body: propertyInsightBody(fields, { analysisMode: "value_history" }),
    });

    const payload = data && typeof data === "object" ? data : {};
    if (payload.error || error) {
      return { ok: false, errorCode: String(payload.error || "invoke_failed") };
    }

    const milestones = payload.milestones;
    if (!Array.isArray(milestones) || milestones.length < 2) {
      return { ok: false, errorCode: "no_market_rate" };
    }

    const series = expandMilestonesToSeries(
      milestones,
      area,
      purchaseYear,
      currentYear,
      Number(fields.purchasePrice) || 0,
    );

    if (series.length < 2) return { ok: false, errorCode: "no_market_rate" };

    return {
      ok: true,
      series,
      summary: payload.insight ? String(payload.insight) : undefined,
    };
  } catch (e) {
    return { ok: false, errorCode: "invoke_failed" };
  }
}
