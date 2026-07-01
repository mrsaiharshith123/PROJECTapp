import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { callGeminiWithFallback } from "../_shared/geminiClient.ts";

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

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
// kept for reference in responses — actual model chosen by callGeminiWithFallback

function buildSystemInstruction(ctx: Record<string, unknown>): string {
  const stressLine = ctx.topStressor
    ? `- Top stressor: ${ctx.topStressor} (₹${ctx.topStressorAmount}/month)`
    : "";
  return `You are a calm, practical personal financial advisor for a salaried Indian user.
Their live financial data:
- Monthly income: ₹${ctx.income}
- Monthly obligations: ₹${ctx.monthlyBurden} (${ctx.committedPct}% of income)
- Free cash after obligations: ₹${ctx.freeCash}
- Pressure score: ${ctx.pressureScore ?? "not calculated"}/100 (${ctx.pressureLabel})
- Survival runway: ${ctx.survivalMonths != null ? `${ctx.survivalMonths} months` : "not calculated"}
- Overdue commitments: ${ctx.overdueCount}
${stressLine}

Rules:
- Answer ONLY about this user's specific situation using their real numbers above.
- Be concise: 2–3 sentences maximum.
- End with one practical, actionable recommendation.
- Always end with: 'Educational only — not financial advice.'
- Never recommend specific financial products, insurance providers, or broker names.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
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
      return json({ error: "pro_required" }, 403);
    }

    if (!geminiKey) {
      return json({ error: "ai_not_configured", source: "local" }, 503);
    }

    const body = await req.json();
    const question = String(body?.question || "").trim();
    const contextData =
      body?.contextData && typeof body.contextData === "object"
        ? (body.contextData as Record<string, unknown>)
        : {};

    if (!question) return json({ error: "question_required" }, 400);

    const systemInstruction = buildSystemInstruction(contextData);
    const fullPrompt = `${systemInstruction}\n\nUser question: ${question}`;

    let answer = "";
    try {
      const result = await callGeminiWithFallback(geminiKey, {
        prompt: fullPrompt,
        maxOutputTokens: 400,
        temperature: 0.2,
        useGoogleSearch: false,
      });
      answer = result.text;
    } catch (e) {
      const detail = String(e);
      const geminiMatch = detail.match(/gemini_(\d+)/);
      return json({
        error: geminiMatch ? `gemini_${geminiMatch[1]}` : "ai_request_failed",
        detail: detail.slice(0, 300),
      });
    }

    if (!answer) return json({ error: "empty_ai_response" });

    return json({ answer, source: "ai" });
  } catch (e) {
    return json({ error: "internal_error", message: String(e) }, 500);
  }
});
