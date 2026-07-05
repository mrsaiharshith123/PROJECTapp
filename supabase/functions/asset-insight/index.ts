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
  const govtMd = (md.governmentRate || {}) as Record<string, number | string | null>;
  const govt = govtMd.perSqyd != null ? Number(govtMd.perSqyd) : null;

  let perSqyd = rate.perSqyd != null ? Number(rate.perSqyd) : null;
  const perSqft = rate.perSqft != null ? Number(rate.perSqft) : null;
  const rangeMin = rate.rangeMin != null ? Number(rate.rangeMin) : null;
  const rangeMax = rate.rangeMax != null ? Number(rate.rangeMax) : null;
  if ((!perSqyd || Number.isNaN(perSqyd)) && perSqft && !Number.isNaN(perSqft)) {
    perSqyd = perSqft * 9;
  }

  /** Prefer range midpoint — AI point estimates jump between calls. */
  if (rangeMin && rangeMax && !Number.isNaN(rangeMin) && !Number.isNaN(rangeMax) && rangeMax >= rangeMin) {
    const mid = Math.round((rangeMin + rangeMax) / 2);
    if (govt && govt > 0) {
      const target = govt * 2.5;
      const candidates = [mid, perSqyd, govt * 2, govt * 2.5, govt * 3].filter(
        (n): n is number => typeof n === "number" && n > 0 && !Number.isNaN(n),
      );
      perSqyd = candidates.reduce((best, c) =>
        Math.abs(c - target) < Math.abs(best - target) ? c : best,
      );
    } else {
      perSqyd = mid;
    }
    rate.perSqyd = perSqyd;
    rate.rangeMin = rangeMin;
    rate.rangeMax = rangeMax;
    md.marketRate = rate;
  } else if (perSqyd && govt && govt > 0) {
    const minM = govt * 1.4;
    const maxM = govt * 4.5;
    if (perSqyd < minM || perSqyd > maxM) {
      perSqyd = Math.round(govt * 2.5);
      rate.perSqyd = perSqyd;
      md.marketRate = rate;
    }
  }

  if (perSqyd && area > 0) {
    md.impliedMarketValue = Math.round(perSqyd * area);
  }
  if (!perSqyd && rangeMin && rangeMax && !Number.isNaN(rangeMin) && !Number.isNaN(rangeMax)) {
    const mid = Math.round((Number(rangeMin) + Number(rangeMax)) / 2);
    rate.perSqyd = mid;
    md.marketRate = rate;
    if (area > 0) md.impliedMarketValue = mid * area;
  }
  if (md.impliedMarketValue != null && md.valuationGap == null) {
    md.valuationGap = Number(md.impliedMarketValue) - currentValue;
  }
  if (govt && perSqyd && govt > 0 && md.marketVsGovtGap == null) {
    md.marketVsGovtGap = Math.round(((perSqyd - govt) / govt) * 1000) / 10;
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
  const currentYear = new Date().getFullYear();
  const historyBlock = withHistory
    ? `,"milestones":[{"year":1980,"ratePerSqyd":<N>},...${milestoneCountForSpan(currentYear - 1980)} LOCALITY ₹/sqyd key years 1980→${currentYear},PER SQYD not plot total,non-flat rates not CAGR]`
    : "";

  return `Gemini (Google AI). ${loc}. ${area} ${b.areaUnit || "sqyd"}.
Search:
- "${loc} property rate per sqyard 2026"
- "${loc} IGRS guideline rate 2025" OR "${loc} ready reckoner rate" OR "${loc} stamp duty value 2024-25"
One web search for 2026 ₹/sqyd in this locality. JSON only, no markdown:
{"marketRate":{"perSqyd":<N>,"rangeMin":<N>,"rangeMax":<N>,"confidence":"medium","dataSource":"<site>"},"governmentRate":{"perSqyd":<government guideline/circle rate per sqyard as number or null>,"source":"<IGRS Telangana / Ready Reckoner / Sub-registrar rate>","asOf":"<financial year e.g. 2024-25>","confidence":"high|medium|low","note":"<one line about what this rate means legally>"},"marketVsGovtGap":<((marketRate.perSqyd - governmentRate.perSqyd) / governmentRate.perSqyd * 100) rounded to 1 decimal or null>,"impliedMarketValue":<perSqyd*${area}>,"trend":{"direction":"rising|flat|declining","annualGrowthPct":<N>,"description":"<short>"},"holdRecommendation":{"verdict":"hold|sell|wait","specificReason":"<short>"},"summary":"<one sentence>"${historyBlock}}
The government rate is the official IGRS (Inspector General of Registration & Stamps) guideline/circle rate — the MINIMUM value for stamp duty. Market rate is typically 1.5x–4x the government rate in urban India. perSqyd MUST equal (rangeMin+rangeMax)/2 and stay within 1.5x–4x of governmentRate when known. Search for the actual IGRS rate for this specific area, not a city average.`;
}

function buildPropertyBundlePrompt(b: Record<string, unknown>): string {
  return buildPropertyMarketCompact(b, true);
}

function buildPropertyPrompt(b: Record<string, unknown>): string {
  return buildPropertyMarketCompact(b, Boolean(b.includeValueHistory));
}

function buildPropertyValueHistoryPrompt(b: Record<string, unknown>): string {
  const loc = [b.location, b.latitude && b.longitude ? `GPS ${b.latitude},${b.longitude}` : ""]
    .filter(Boolean)
    .join(" · ");
  const currentYear = new Date().getFullYear();
  const historyStart = 1980;
  const span = currentYear - historyStart;
  const count = milestoneCountForSpan(span);

  return `Gemini (Google AI). LOCALITY ₹/sqyd market history: ${loc}.
Search: "${loc} property rate per sqyard history" and local IGRS/guideline trends.
Return PER-SQYARD rates for this LOCALITY (not total plot value, not per sqft).
${count} milestones from ${historyStart} to ${currentYear}. JSON only:
{"milestones":[{"year":${historyStart},"ratePerSqyd":<N>},...key years including 2000,2008,2020 COVID dip...,{"year":${currentYear},"ratePerSqyd":<N>}],"summary":"<short>"}
Non-flat locality rates (booms/dips), not CAGR.`;
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

function buildStockPrompt(b: Record<string, unknown>): string {
  const ticker = String(b.ticker || b.name || "").trim();
  const exchange = String(b.exchange || "NSE");
  return `Search Google for ${ticker} current stock price on ${exchange} India today 2026.

Holding: ${b.quantity || "?"} shares, avg buy ₹${Number(b.buyPrice || 0).toLocaleString("en-IN")}, current value ₹${Number(b.currentValue || 0).toLocaleString("en-IN")}

Return ONLY compact JSON (no markdown):
{"currentPrice":<N>,"52wHigh":<N>,"52wLow":<N>,"pe":<N>,"outlook":"bullish|neutral|bearish","holdVerdict":"hold|sell|wait","reason":"<2 sentences>","summary":"<1 sentence>","holdRecommendation":{"verdict":"hold|sell|wait","reason":"<same as reason>"}}`;
}

function buildMutualFundPrompt(b: Record<string, unknown>): string {
  const fundType = String(b.fundSubType || "equity");
  return `Search Google for outlook on ${fundType} mutual funds in India 2026.

Fund: ${b.name || fundType} (${fundType})
Invested: ₹${Number(b.purchasePrice || 0).toLocaleString("en-IN")}, current value ₹${Number(b.currentValue || 0).toLocaleString("en-IN")}
${b.monthlySip ? `Monthly SIP: ₹${Number(b.monthlySip).toLocaleString("en-IN")}` : ""}

Return ONLY compact JSON:
{"categoryOutlook":"bullish|neutral|bearish","expectedReturn":<N>,"riskLevel":"low|moderate|high","recommendation":"<1 sentence>","summary":"<1 sentence>","holdRecommendation":{"verdict":"hold|sell|review","reason":"<recommendation>"}}`;
}

function buildCryptoPrompt(b: Record<string, unknown>): string {
  return `Search Google for ${b.name} cryptocurrency price outlook India 2026 in INR.

Current value entered: ₹${Number(b.currentValue || 0).toLocaleString("en-IN")}
Purchase: ₹${Number(b.purchasePrice || 0).toLocaleString("en-IN")} in ${b.purchaseYear || "unknown"}

Return ONLY compact JSON:
{"currentPriceInr":<N>,"trend":"rising|falling|volatile","riskNote":"<1 sentence>","summary":"<1 sentence>","holdRecommendation":{"verdict":"hold|sell|review","reason":"<riskNote>"}}`;
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
          useGoogleSearch: true,
          maxOutputTokens: 4096,
          temperature: 0,
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
    } else if (categoryId === "stocks") {
      prompt = buildStockPrompt(body);
    } else if (categoryId === "mutual_fund" || categoryId === "sip") {
      prompt = buildMutualFundPrompt(body);
    } else if (categoryId === "crypto") {
      prompt = buildCryptoPrompt(body);
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
        useGoogleSearch: true,
        maxOutputTokens,
        temperature: 0,
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
