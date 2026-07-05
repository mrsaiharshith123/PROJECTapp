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

/** Categories that support Google AI market / outlook analysis on the detail page. */
export const ASSET_AI_INSIGHT_TYPES = [
  ...PHYSICAL_ASSET_TYPES,
  "stocks",
  "mutual_fund",
  "sip",
  "crypto",
];

const PROPERTY_IDS = new Set([
  "property",
  "property_residential",
  "property_land",
  "property_commercial",
]);

const AI_CACHE_KEY = "perovo_property_ai_cache_v1";
const AI_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const AI_COOLDOWN_MS = 2 * 60 * 1000;
/** @type {Map<string, Promise<unknown>>} */
const inflight = new Map();

function propertyCacheKey(fields, extra = {}) {
  // Location + area + category determine the market rate.
  // currentValue excluded — two plots at same location share one cache entry.
  const loc = (fields.location || "")
    .toLowerCase()
    .replace(/\s*,\s*/g, ",")
    .replace(/\s+/g, " ")
    .trim();
  return JSON.stringify({
    loc,
    area: fields.areaMeasure,
    unit: fields.areaUnit,
    categoryId: fields.categoryId,
    ...extra,
  });
}

function clearPropertyAiCache(fields, extra = {}) {
  const key = propertyCacheKey(fields, extra);
  try {
    const raw = localStorage.getItem(AI_CACHE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    delete store[key];
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function readAiCache(key) {
  try {
    const raw = localStorage.getItem(AI_CACHE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    const hit = store[key];
    if (!hit || Date.now() - hit.at > AI_CACHE_TTL_MS) return null;
    return hit.data;
  } catch {
    return null;
  }
}

function writeAiCache(key, data) {
  try {
    const raw = localStorage.getItem(AI_CACHE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    store[key] = { at: Date.now(), data };
    const keys = Object.keys(store);
    if (keys.length > 40) {
      keys
        .sort((a, b) => (store[a].at || 0) - (store[b].at || 0))
        .slice(0, keys.length - 40)
        .forEach((k) => delete store[k]);
    }
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota */
  }
}

function isOnCooldown(key) {
  try {
    const until = Number(sessionStorage.getItem(`perovo_ai_cd:${key}`) || 0);
    return until > Date.now();
  } catch {
    return false;
  }
}

function setCooldown(key, ms = AI_COOLDOWN_MS) {
  try {
    sessionStorage.setItem(`perovo_ai_cd:${key}`, String(Date.now() + ms));
  } catch {
    /* ignore */
  }
}

async function invokeAssetInsight(body, cacheKey) {
  if (cacheKey) {
    const cached = readAiCache(cacheKey);
    if (cached) return cached;
    if (isOnCooldown(cacheKey)) {
      return { error: "rate_limited", message: "Please wait a moment before fetching again." };
    }
    if (inflight.has(cacheKey)) return inflight.get(cacheKey);
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "unauthorized" };
  }

  const run = supabase.functions
    .invoke(ASSET_INSIGHT_FUNCTION, { body })
    .then(({ data, error }) => {
      const payload = data && typeof data === "object" ? data : {};
      if (payload.error) return payload;
      if (error) return { error: "invoke_failed", message: error.message };
      if (cacheKey && payload.insight != null && !payload.error) {
        writeAiCache(cacheKey, payload);
      }
      if (String(payload.error || "").includes("429") || String(payload.message || "").includes("429")) {
        if (cacheKey) setCooldown(cacheKey, 5 * 60 * 1000);
      }
      return payload;
    })
    .finally(() => {
      if (cacheKey) inflight.delete(cacheKey);
    });

  if (cacheKey) inflight.set(cacheKey, run);
  return run;
}

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
  if (code === "rate_limited" || code === "gemini_429" || code.includes("429")) {
    return t("wealthDetail.market.failedRateLimit");
  }
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

  if (entry.categoryId === "stocks") {
    if (entry.ticker) lines.push(`Ticker: ${entry.ticker} (${entry.exchange || "NSE"})`);
    if (entry.quantity) lines.push(`Quantity: ${entry.quantity}`);
    if (entry.buyPrice) lines.push(`Avg buy price: ₹${Number(entry.buyPrice).toLocaleString("en-IN")}`);
    lines.push(
      `Search for ${entry.ticker || entry.name} current price on NSE/BSE. Return structured outlook with hold verdict.`,
    );
  }

  if (entry.categoryId === "mutual_fund" || entry.categoryId === "sip") {
    if (entry.fundSubType) lines.push(`Fund type: ${entry.fundSubType}`);
    if (entry.monthlySip) lines.push(`Monthly SIP: ₹${Number(entry.monthlySip).toLocaleString("en-IN")}`);
    lines.push(`Search for outlook on ${entry.fundSubType || "equity"} mutual funds in India 2026.`);
  }

  if (entry.categoryId === "crypto") {
    lines.push("Indian crypto tax: flat 30% on gains, no loss offset.");
    lines.push(`Search for ${entry.name} price outlook India 2026.`);
  }

  const depth = PROPERTY_IDS.has(entry.categoryId)
    ? `Write 4–6 sentences for an Indian property owner. Cover: (1) is it worth holding longer vs selling, (2) liquidity and emergency-access risks, (3) local infra / development outlook for this area (mention realistic project types — highways, industrial parks, RERA residential — not invented names), (4) inflation-adjusted return context, (5) one concrete next step (title check, rent comparison, or diversification). Be specific to the location and numbers given.`
    : `Be concise (2–3 sentences). Cover appreciation outlook, liquidity, and one practical action.`;

  return `Analyse this personal asset for an Indian individual. ${depth} End with: Educational only — not financial advice.

${lines.join("\n")}`;
}

/**
 * @param {import('../../utils/netWorth/wealthStorage.js').WealthEntry} entry
 * @param {(key: string, params?: object) => string} t
 * @param {object} [settings]
 * @param {object} [opts]
 * @param {boolean} [opts.includeValueHistory] - bundle chart milestones in same Gemini call (property only)
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
      const cacheKey = PROPERTY_IDS.has(entry.categoryId)
        ? propertyCacheKey(entry, wantHistory ? { withHistory: true } : {})
        : null;
      const payload = await invokeAssetInsight(
        propertyInsightBody(entry, { includeValueHistory: wantHistory || undefined }),
        cacheKey,
      );

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

      if (!payload.error && payload.insight != null) {
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

      return {
        insight: null,
        marketData: null,
        structured: false,
        source: "error",
        errorCode: "invoke_failed",
      };
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
    weightGrams: fields.weightGrams ?? null,
    purityKarat: fields.purityKarat ?? null,
    vehicleMake: fields.vehicleMake ?? null,
    vehicleYear: fields.vehicleYear ?? null,
    ticker: fields.ticker ?? null,
    exchange: fields.exchange ?? null,
    quantity: fields.quantity ?? null,
    buyPrice: fields.buyPrice ?? null,
    fundSubType: fields.fundSubType ?? null,
    monthlySip: fields.monthlySip ?? null,
    folio: fields.folio ?? null,
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
  if (!getSupabaseClient()) {
    return { ok: false, errorCode: "unauthorized" };
  }

  const storedRate = Number(fields.marketRatePerSqyd) || 0;
  const area = Number(fields.areaMeasure) || 0;
  if (storedRate > 0 && area > 0 && !fields.forceRefresh) {
    return {
      ok: true,
      value: Math.round(storedRate * area),
      marketRatePerSqyd: storedRate,
      annualGrowthPct: null,
      dataSource: "stored",
      marketData: { marketRate: { perSqyd: storedRate, dataSource: "stored" } },
    };
  }

  try {
    const cacheKey = propertyCacheKey(fields);
    const payload = await invokeAssetInsight(propertyInsightBody(fields), cacheKey);
    if (payload.error) {
      return {
        ok: false,
        errorCode: String(payload.error),
        errorMessage: payload.message ? String(payload.message) : undefined,
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
  if (!getSupabaseClient()) return { ok: false, errorCode: "unauthorized" };

  try {
    const cacheKey = propertyCacheKey(fields, { withHistory: true });
    const payload = await invokeAssetInsight(
      propertyInsightBody(fields, { analysisMode: "property_bundle" }),
      cacheKey,
    );
    if (payload.error) {
      return {
        ok: false,
        errorCode: String(payload.error),
        errorMessage: payload.message ? String(payload.message) : undefined,
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
  if (!getSupabaseClient()) return { ok: false, errorCode: "unauthorized" };

  const purchaseYear = Number(fields.purchaseYear);
  const area = Number(fields.areaMeasure) || 0;
  const currentYear = new Date().getFullYear();
  if (!purchaseYear || purchaseYear >= currentYear || !area) {
    return { ok: false, errorCode: "invalid_input" };
  }

  try {
    const cacheKey = propertyCacheKey(fields, { history: true });
    const payload = await invokeAssetInsight(
      propertyInsightBody(fields, { analysisMode: "value_history" }),
      cacheKey,
    );
    if (payload.error) {
      return { ok: false, errorCode: String(payload.error) };
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
  } catch (_e) {
    return { ok: false, errorCode: "invoke_failed" };
  }
}

export { clearPropertyAiCache };
