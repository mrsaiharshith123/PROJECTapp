import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { callGeminiWithFallback } from "../_shared/geminiClient.ts";
import { sanitizeAssetInsightBody } from "../_shared/sanitizeAssetInsight.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Business errors return 200 so Supabase invoke always delivers the JSON body to the client. */
function aiError(code: string, message: string, extra: Record<string, unknown> = {}) {
  return json({ error: code, message, insight: null, structured: false, marketData: null, ...extra });
}

function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      // fall through to salvage
    }
  }
  return salvagePropertyJson(raw);
}

/** Pull numeric fields from truncated Gemini JSON (common when output token budget is tight). */
function salvagePropertyJson(raw: string): Record<string, unknown> {
  const pick = (key: string): number | null => {
    const m = raw.match(new RegExp(`"${key}"\\s*:\\s*([0-9][0-9,]*)`, "i"));
    if (!m) return null;
    const n = Number(m[1].replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  const perSqyd = pick("perSqyd") ?? pick("per_sqyd");
  const perSqft = pick("perSqft") ?? pick("per_sqft");
  const rangeMin = pick("rangeMin");
  const rangeMax = pick("rangeMax");
  const impliedMarketValue = pick("impliedMarketValue");

  if (perSqyd == null && perSqft == null && rangeMin == null && rangeMax == null && impliedMarketValue == null) {
    throw new Error("No JSON found");
  }

  const resolvedPerSqyd =
    perSqyd ??
    (perSqft != null ? perSqft * 9 : null) ??
    (rangeMin != null && rangeMax != null ? Math.round((rangeMin + rangeMax) / 2) : null) ??
    rangeMin ??
    rangeMax;

  const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)"/);
  return {
    marketRate: {
      perSqyd: resolvedPerSqyd,
      perSqft,
      unit: "sqyd",
      rangeMin,
      rangeMax,
      confidence: "medium",
      dataSource: "Google Search",
    },
    impliedMarketValue,
    summary: summaryMatch?.[1] ?? "",
  };
}

function buildPropertyRateOnlyPrompt(b: Record<string, unknown>): string {
  const loc = [b.location, b.latitude && b.longitude ? `GPS ${b.latitude},${b.longitude}` : ""]
    .filter(Boolean)
    .join(" · ");
  const area = Number(b.areaMeasure || 0);
  return `Search Google for 2026 residential plot/land rate per sqyard in: ${loc}

Return ONLY this compact JSON (no markdown, keep summary under 30 words):
{"marketRate":{"perSqyd":<number>,"rangeMin":<number>,"rangeMax":<number>,"confidence":"high|medium|low","dataSource":"<site>"},"impliedMarketValue":${area > 0 ? `<perSqyd*${area}>` : "<number>"},"summary":"<one sentence with ₹/sqyd>"}`;
}

const PROPERTY_IDS = new Set([
  "property",
  "property_residential",
  "property_land",
  "property_commercial",
]);

function enrichPropertyMarketData(
  md: Record<string, unknown>,
  body: Record<string, unknown>,
): Record<string, unknown> {
  const area = Number(body.areaMeasure || 0);
  const currentValue = Number(body.currentValue || 0);
  const rate = (md.marketRate || {}) as Record<string, number | string | null>;

  let perSqyd = rate.perSqyd != null ? Number(rate.perSqyd) : null;
  const perSqft = rate.perSqft != null ? Number(rate.perSqft) : null;
  const rangeMin = rate.rangeMin != null ? Number(rate.rangeMin) : null;
  const rangeMax = rate.rangeMax != null ? Number(rate.rangeMax) : null;
  if ((!perSqyd || Number.isNaN(perSqyd)) && perSqft && !Number.isNaN(perSqft)) {
    perSqyd = perSqft * 9;
    rate.perSqyd = perSqyd;
    md.marketRate = rate;
  }

  if (perSqyd && area > 0 && !md.impliedMarketValue) {
    md.impliedMarketValue = Math.round(perSqyd * area);
  }
  if (!perSqyd && rangeMin && rangeMax && !Number.isNaN(rangeMin) && !Number.isNaN(rangeMax)) {
    const mid = Math.round((Number(rangeMin) + Number(rangeMax)) / 2);
    rate.perSqyd = mid;
    md.marketRate = rate;
    if (area > 0 && !md.impliedMarketValue) md.impliedMarketValue = mid * area;
  }
  if (md.impliedMarketValue != null && md.valuationGap == null) {
    md.valuationGap = Number(md.impliedMarketValue) - currentValue;
  }
  return md;
}

/** More milestones for longer holding periods (10–100+ years). */
function milestoneCountForSpan(spanYears: number): number {
  if (spanYears <= 15) return 6;
  if (spanYears <= 30) return 8;
  if (spanYears <= 50) return 10;
  if (spanYears <= 75) return 12;
  return 14;
}

function buildPropertyMarketCompact(b: Record<string, unknown>, withHistory = false): string {
  const loc = [b.location, b.latitude && b.longitude ? `GPS ${b.latitude},${b.longitude}` : ""]
    .filter(Boolean)
    .join(" · ");
  const area = Number(b.areaMeasure) || 0;
  const purchaseYear = Number(b.purchaseYear) || 0;
  const currentYear = new Date().getFullYear();
  const purchasePrice = Number(b.purchasePrice) || 0;
  const purchaseRate =
    b.purchaseRatePerUnit != null
      ? Number(b.purchaseRatePerUnit)
      : area > 0 && purchasePrice > 0
        ? purchasePrice / area
        : 0;

  const historyBlock = withHistory && purchaseYear > 0
    ? `,"milestones":[{"year":${purchaseYear},"ratePerSqyd":${Math.round(purchaseRate) || 30}},{"year":<Y>,"ratePerSqyd":<N>},...${milestoneCountForSpan(currentYear - purchaseYear)} key years evenly from ${purchaseYear} to ${currentYear},non-flat rates not CAGR]`
    : "";

  return `Gemini (Google AI). ${loc}. ${area} ${b.areaUnit || "sqyd"}.
One web search for 2026 ₹/sqyd in this locality. JSON only, no markdown:
{"marketRate":{"perSqyd":<N>,"rangeMin":<N>,"rangeMax":<N>,"confidence":"medium","dataSource":"<site>"},"impliedMarketValue":<perSqyd*${area}>,"trend":{"direction":"rising|flat|declining","annualGrowthPct":<N>,"description":"<short>"},"holdRecommendation":{"verdict":"hold|sell|wait","specificReason":"<short>"},"summary":"<one sentence>"${historyBlock}}`;
}

function buildPropertyBundlePrompt(b: Record<string, unknown>): string {
  return buildPropertyMarketCompact(b, true);
}

function buildPropertyPrompt(b: Record<string, unknown>): string {
  return buildPropertyMarketCompact(b, Boolean(b.includeValueHistory));
}

function buildPropertyValueHistoryPrompt(b: Record<string, unknown>): string {
  const purchaseYear = Number(b.purchaseYear) || 1980;
  const currentYear = new Date().getFullYear();
  const area = Number(b.areaMeasure) || 0;
  const purchaseRate =
    b.purchaseRatePerUnit != null
      ? Number(b.purchaseRatePerUnit)
      : area > 0 && Number(b.purchasePrice) > 0
        ? Number(b.purchasePrice) / area
        : 30;
  const currentRate =
    b.marketRatePerSqyd != null
      ? Number(b.marketRatePerSqyd)
      : area > 0 && Number(b.currentValue) > 0
        ? Number(b.currentValue) / area
        : 0;

  const span = currentYear - purchaseYear;
  const count = milestoneCountForSpan(span);

  return `Gemini. ${b.location}. ${area}sqyd. ₹/sqyd ${purchaseYear}→${currentYear} (${span}y). JSON only:
{"milestones":[{"year":${purchaseYear},"ratePerSqyd":${Math.round(purchaseRate)}},...${count} key years spread across ${span} years...,{"year":${currentYear},"ratePerSqyd":${Math.round(currentRate)}}],"summary":"<short>"}
Non-flat rates (booms/dips), not CAGR. Include pre-1990, 2000s boom, 2008 dip, COVID if relevant.`;
}

function buildGoldPrompt(b: Record<string, unknown>): string {
  return `You are a gold market analyst. Search Google for current Indian gold prices.

Search:
- "gold price India today per gram 2026"
- "24K gold rate India today"
- "gold outlook India 2026"

Asset: ${b.weightGrams || "?"}g ${b.purityKarat || 24}K gold
Purchase year: ${b.purchaseYear || "unknown"}, price: ₹${Number(b.purchasePrice || 0).toLocaleString("en-IN")}

Respond ONLY with valid JSON:
{
  "currentRatePerGram": { "22K": <number>, "24K": <number>, "dataSource": "<source>" },
  "impliedCurrentValue": <weightGrams * rate * purity/24 as integer>,
  "trend": { "direction": "rising"|"flat"|"declining", "description": "<specific sentence>" },
  "marketOutlook": { "shortTerm": "<3-6 month>", "longTerm": "<1-3 year>" },
  "holdRecommendation": { "verdict": "hold"|"sell"|"accumulate", "reason": "<specific>" },
  "sgbAdvantage": "<specific comparison to SGB with current rates>",
  "summary": "<2-3 sentences>"
}`;
}

function buildVehiclePrompt(b: Record<string, unknown>): string {
  return `You are a used car analyst for India. Search for current resale value.

Search: "${b.vehicleMake || b.name} resale value India 2026"

Vehicle: ${b.vehicleMake || b.name}, year ${b.vehicleYear || "unknown"}
Purchase year: ${b.purchaseYear || "unknown"}, price: ₹${Number(b.purchasePrice || 0).toLocaleString("en-IN")}

Respond ONLY with valid JSON:
{
  "estimatedResaleValue": { "low": <number>, "mid": <number>, "high": <number>, "confidence": "high"|"medium"|"low", "dataSource": "<source>" },
  "marketDemand": "high"|"medium"|"low",
  "sellNowOrWait": { "recommendation": "sell_now"|"wait"|"keep", "reason": "<specific>" },
  "topBuyingPlatforms": ["<platform 1>", "<platform 2>"],
  "summary": "<2-3 sentences>"
}`;
}

function buildGenericPrompt(b: Record<string, unknown>): string {
  return `You are a personal finance analyst for Indian salaried users. Search for current market conditions.

Asset: ${b.name} (${b.categoryId})
Value: ₹${Number(b.currentValue || 0).toLocaleString("en-IN")}
Purchase year: ${b.purchaseYear || "unknown"}

Search Google for current outlook on this asset type in India 2026.

Respond ONLY with valid JSON:
{
  "trend": { "direction": "rising"|"flat"|"declining", "description": "<one sentence>" },
  "holdRecommendation": { "verdict": "hold"|"sell"|"review", "reason": "<2 sentences>" },
  "actionableNext": "<one concrete action>",
  "summary": "<2-3 sentences>"
}`;
}

const AI_DAILY_LIMITS: Record<string, number> = {
  pro: 20,
  power: 60,
};

async function checkAiRateLimit(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  functionName: string,
  tier: string,
) {
  const limit = AI_DAILY_LIMITS[tier] ?? 0;
  if (limit <= 0) return { ok: false, reason: "pro_required" };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await adminClient
    .from("ai_insight_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("function_name", functionName)
    .gte("created_at", since);

  if (error) return { ok: false, reason: "rate_limit_error" };
  if ((count ?? 0) >= limit) return { ok: false, reason: "rate_limit_exceeded", limit };
  return { ok: true, limit };
}

async function logAiUsage(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  functionName: string,
) {
  await adminClient.from("ai_insight_usage").insert({
    user_id: userId,
    function_name: functionName,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json({ error: "server_not_configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return json({ error: "unauthorized" }, 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userData.user.id)
      .maybeSingle();
    const tier = profile?.subscription_tier || "free";
    if (tier !== "pro" && tier !== "power") {
      return aiError("pro_required", "Asset AI insights require a Pro or Power plan.");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const rate = await checkAiRateLimit(adminClient, userData.user.id, "asset-insight", tier);
    if (!rate.ok) {
      if (rate.reason === "rate_limit_exceeded") {
        return aiError("rate_limit_exceeded", `Daily AI limit reached (${rate.limit}/day).`);
      }
      return aiError(rate.reason || "forbidden", "Unable to process AI request.");
    }

    if (!geminiKey) {
      return aiError("ai_not_configured", "GOOGLE_GEMINI_API_KEY not set on server");
    }

    const body = sanitizeAssetInsightBody(await req.json());
    const categoryId = String(body?.categoryId || "");
    const analysisMode = String(body.analysisMode || "market");

    if (analysisMode === "value_history" && PROPERTY_IDS.has(categoryId)) {
      const lat =
        body.latitude != null && body.longitude != null
          ? { latitude: Number(body.latitude), longitude: Number(body.longitude) }
          : undefined;
      let geminiResult;
      try {
        geminiResult = await callGeminiWithFallback(geminiKey, {
          prompt: buildPropertyValueHistoryPrompt(body),
          latLng: lat,
          useGoogleSearch: false,
          maxOutputTokens: 4096,
          temperature: 0.15,
        });
      } catch (e) {
        const msg = String(e);
        const geminiMatch = msg.match(/gemini_(\d+)/);
        return aiError(geminiMatch ? `gemini_${geminiMatch[1]}` : "internal_error", msg);
      }

      try {
        const parsed = extractJson(geminiResult.text) as Record<string, unknown>;
        const milestones = Array.isArray(parsed.milestones) ? parsed.milestones : [];
        if (milestones.length < 2) {
          return aiError("no_market_rate", "AI did not return enough historical milestones");
        }
        await logAiUsage(adminClient, userData.user.id, "asset-insight");
        return json({
          insight: String(parsed.summary || ""),
          milestones,
          structured: true,
          source: "ai",
          analysisMode: "value_history",
          model: geminiResult.model,
        });
      } catch {
        return aiError(
          "unstructured_response",
          "AI did not return parseable value history JSON",
          { rawPreview: geminiResult.text.slice(0, 300) },
        );
      }
    }

    if (analysisMode === "property_bundle" && PROPERTY_IDS.has(categoryId)) {
      body.includeValueHistory = true;
    }

    let prompt: string;
    let maxOutputTokens = 4096;
    if (PROPERTY_IDS.has(categoryId)) {
      prompt = buildPropertyPrompt(body);
    } else if (categoryId === "gold") {
      prompt = buildGoldPrompt(body);
    } else if (categoryId === "vehicle") {
      prompt = buildVehiclePrompt(body);
    } else {
      prompt = buildGenericPrompt(body);
    }

    const lat =
      body.latitude != null && body.longitude != null
        ? { latitude: Number(body.latitude), longitude: Number(body.longitude) }
        : undefined;

    let geminiResult;
    try {
      geminiResult = await callGeminiWithFallback(geminiKey, {
        prompt,
        latLng: lat,
        useGoogleSearch: false,
        maxOutputTokens,
        temperature: 0.1,
      });
    } catch (e) {
      const msg = String(e);
      const geminiMatch = msg.match(/gemini_(\d+)/);
      return aiError(
        geminiMatch ? `gemini_${geminiMatch[1]}` : "internal_error",
        msg,
      );
    }

    let rawText = geminiResult.text;
    let marketData: unknown = null;
    let structured = false;

    const parseMarket = (text: string) => {
      const parsed = extractJson(text) as Record<string, unknown>;
      return PROPERTY_IDS.has(categoryId) ? enrichPropertyMarketData(parsed, body) : parsed;
    };

    try {
      marketData = parseMarket(rawText);
      structured = true;
    } catch {
      try {
        marketData = salvagePropertyJson(rawText);
        if (PROPERTY_IDS.has(categoryId)) {
          marketData = enrichPropertyMarketData(marketData as Record<string, unknown>, body);
        }
        structured = true;
      } catch {
        return aiError(
          "unstructured_response",
          "Model did not return parseable market JSON",
          { rawPreview: rawText.slice(0, 300) },
        );
      }
    }

    const md = (marketData || {}) as Record<string, unknown>;
    if (PROPERTY_IDS.has(categoryId)) {
      const rate = (md.marketRate || {}) as Record<string, unknown>;
      const perSqyd = rate.perSqyd != null ? Number(rate.perSqyd) : null;
      const perSqft = rate.perSqft != null ? Number(rate.perSqft) : null;
      const hasRate =
        (perSqyd != null && !Number.isNaN(perSqyd) && perSqyd > 0) ||
        (perSqft != null && !Number.isNaN(perSqft) && perSqft > 0);
      if (!hasRate && !md.impliedMarketValue) {
        return aiError("no_market_rate", "Search did not return a usable per-unit rate", {
          rawPreview: rawText.slice(0, 300),
        });
      }
    }

    const holdRec = md?.holdRecommendation as Record<string, string> | undefined;
    const summary =
      (md?.summary as string) || holdRec?.reason || holdRec?.specificReason || rawText.slice(0, 300);

    const milestones = Array.isArray(md.milestones) ? md.milestones : null;

    await logAiUsage(adminClient, userData.user.id, "asset-insight");

    return json({
      insight: summary,
      marketData,
      milestones,
      source: "ai",
      structured,
      model: geminiResult.model,
      usedSearch: geminiResult.usedSearch,
    });
  } catch (e) {
    return aiError("internal_error", String(e));
  }
});
