import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

function buildSystemPrompt(ctx: Record<string, unknown>) {
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
- Answer only about this user's specific situation using their numbers.
- Be concise: 2–3 sentences maximum.
- End with one practical recommendation.
- Always add: 'Educational only — not financial advice.'
- Never recommend specific financial products, insurance providers, or broker names.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: "server_not_configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "unauthorized" }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "unauthorized" }, 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userData.user.id)
      .maybeSingle();

    const tier = profile?.subscription_tier || "free";
    if (tier !== "pro" && tier !== "power") {
      return json({ error: "pro_required" }, 403);
    }

    const body = await req.json();
    const question = String(body?.question || "").trim();
    const contextData = body?.contextData && typeof body.contextData === "object" ? body.contextData : {};

    if (!question) {
      return json({ error: "question_required" }, 400);
    }

    if (!anthropicKey) {
      return json({ error: "ai_not_configured", source: "local" }, 503);
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 350,
        system: buildSystemPrompt(contextData),
        messages: [{ role: "user", content: question }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: "ai_request_failed", detail: detail.slice(0, 200) }, 502);
    }

    const data = await res.json();
    const answer = (data.content || [])
      .filter((block: { type?: string }) => block.type === "text")
      .map((block: { text?: string }) => block.text)
      .join("\n")
      .trim();

    if (!answer) {
      return json({ error: "empty_ai_response" }, 502);
    }

    return json({ answer, source: "ai" });
  } catch (e) {
    return json({ error: "internal_error", message: String(e) }, 500);
  }
});
