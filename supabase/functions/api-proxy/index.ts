import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { checkUsageRateLimit, logUsage } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROXY_DAILY_LIMITS: Record<string, number> = {
  "vision-ocr": 30,
  "gold-price": 120,
  "kyc-pan": 10,
  "kyc-bank": 10,
  "leegality-create": 5,
  "leegality-status": 60,
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireUser(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return { error: json({ error: "server_not_configured" }, 500) };
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { error: json({ error: "unauthorized" }, 401) };

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: json({ error: "unauthorized" }, 401) };

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  return { user, adminClient };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await requireUser(req);
    if ("error" in auth && auth.error) return auth.error;
    const { user, adminClient } = auth;

    const { data: profile } = await adminClient
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .maybeSingle();
    const tier = profile?.subscription_tier || "free";
    if (tier !== "pro" && tier !== "power") {
      return json({ error: "pro_required" }, 403);
    }

    const body = await req.json();
    const service = String(body?.service || "");
    const limit = PROXY_DAILY_LIMITS[service] ?? 0;
    if (!limit) return json({ error: "unknown_service" }, 400);

    const rate = await checkUsageRateLimit(adminClient, user.id, `api-proxy:${service}`, limit);
    if (!rate.ok) {
      return json({ error: rate.reason, limit: rate.limit }, rate.reason === "rate_limit_exceeded" ? 429 : 500);
    }

    if (service === "vision-ocr") {
      const visionKey = Deno.env.get("GOOGLE_VISION_API_KEY") || Deno.env.get("GOOGLE_VISION_KEY");
      const imageBase64 = String(body?.imageBase64 || "");
      if (!visionKey) return json({ error: "vision_not_configured" }, 503);
      if (!imageBase64) return json({ error: "image_required" }, 400);
      if (imageBase64.length > 8_000_000) return json({ error: "image_too_large" }, 413);

      const res = await fetch("https://vision.googleapis.com/v1/images:annotate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": visionKey,
        },
        body: JSON.stringify({
          requests: [{ image: { content: imageBase64 }, features: [{ type: "TEXT_DETECTION", maxResults: 1 }] }],
        }),
      });
      if (!res.ok) return json({ error: "vision_request_failed" }, 502);
      const data = await res.json();
      await logUsage(adminClient, user.id, `api-proxy:${service}`);
      return json({ text: data?.responses?.[0]?.fullTextAnnotation?.text || null });
    }

    if (service === "gold-price") {
      const goldKey = Deno.env.get("GOLD_API_KEY");
      if (!goldKey) return json({ error: "gold_not_configured" }, 503);
      const res = await fetch("https://www.goldapi.io/api/XAU/INR", {
        headers: { "x-access-token": goldKey, Accept: "application/json" },
      });
      if (!res.ok) return json({ error: "gold_request_failed" }, 502);
      const data = await res.json();
      const perGram = data.price / 31.1035;
      await logUsage(adminClient, user.id, `api-proxy:${service}`);
      return json({
        perGram: Math.round(perGram),
        per10g: Math.round(perGram * 10),
        date: new Date().toISOString(),
      });
    }

    if (service === "kyc-pan") {
      const token = Deno.env.get("SUREPASS_TOKEN");
      if (!token) return json({ verified: false, error: "kyc_not_configured" });
      const cleanPan = String(body?.panNumber || "").replace(/\s/g, "").toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
        return json({ verified: false, error: "invalid_pan_format" });
      }
      const res = await fetch("https://kyc-api.surepass.io/api/v1/pan/pan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_number: cleanPan }),
      });
      const data = await res.json();
      if (!res.ok || !data?.data) return json({ verified: false, error: data?.message || "pan_not_found" });
      await logUsage(adminClient, user.id, `api-proxy:${service}`);
      return json({
        verified: true,
        name: data.data.name || "",
        panStatus: data.data.pan_status || "",
        nameOnPan: data.data.name || "",
      });
    }

    if (service === "kyc-bank") {
      const token = Deno.env.get("SUREPASS_TOKEN");
      if (!token) return json({ verified: false, error: "kyc_not_configured" });
      const accountNumber = String(body?.accountNumber || "");
      const ifsc = String(body?.ifsc || "");
      const res = await fetch("https://kyc-api.surepass.io/api/v1/bank-verification/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_number: accountNumber, ifsc }),
      });
      const data = await res.json();
      if (!res.ok || !data?.data) return json({ verified: false, error: data?.message || "account_not_found" });
      await logUsage(adminClient, user.id, `api-proxy:${service}`);
      return json({
        verified: true,
        accountName: data.data.full_name || data.data.account_name || "",
        ifsc: data.data.ifsc || ifsc,
        bankName: data.data.bank_name || "",
      });
    }

    if (service === "leegality-create") {
      const base = Deno.env.get("LEEGALITY_BASE_URL") || "https://sandbox.leegality.com";
      const token = Deno.env.get("LEEGALITY_API_TOKEN");
      if (!token) return json({ error: "esign_not_configured" }, 503);

      const payload = {
        name: String(body?.documentTitle || "Perovo Agreement").slice(0, 100),
        description: "Promissory note — Perovo Financial OS",
        file_data: body?.pdfBase64,
        signers: [
          {
            name: String(body?.signerName || "").slice(0, 100),
            email: body?.signerEmail || "",
            phone: String(body?.signerPhone || "").replace(/\D/g, "").slice(-10),
            sign_type: "AADHAAR_OTP",
            ...(body?.signerAadhaar
              ? { aadhaar: String(body.signerAadhaar).replace(/\s/g, "").slice(-4) }
              : {}),
          },
        ],
        notify_signers: true,
        send_email: Boolean(body?.signerEmail),
      };

      const res = await fetch(`${base}/api/v3.0/document`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data && typeof data === "object" && "message" in data ? String(data.message) : "";
        return json({ error: msg || "Leegality API error" }, 502);
      }
      const documentId = String(data.documentId || data.id || "");
      if (documentId) {
        await adminClient.from("api_proxy_documents").upsert({
          user_id: user.id,
          document_id: documentId,
          service: "leegality",
        });
      }
      await logUsage(adminClient, user.id, `api-proxy:${service}`);
      return json({
        documentId,
        signingUrl: data.signers?.[0]?.invitationUrl || data.signing_url,
        status: "pending",
      });
    }

    if (service === "leegality-status") {
      const base = Deno.env.get("LEEGALITY_BASE_URL") || "https://sandbox.leegality.com";
      const token = Deno.env.get("LEEGALITY_API_TOKEN");
      const documentId = String(body?.documentId || "");
      if (!token || !documentId) return json({ error: "document_required" }, 400);

      const { data: owned } = await adminClient
        .from("api_proxy_documents")
        .select("document_id")
        .eq("user_id", user.id)
        .eq("document_id", documentId)
        .maybeSingle();
      if (!owned) return json({ error: "forbidden" }, 403);

      const res = await fetch(`${base}/api/v3.0/document/${documentId}`, {
        headers: { "X-Auth-Token": token },
      });
      const data = await res.json();
      await logUsage(adminClient, user.id, `api-proxy:${service}`);
      return json({
        documentId,
        status: data.status,
        signedPdfUrl: data.signedFileUrl || null,
        completedAt: data.completedAt || null,
      });
    }

    return json({ error: "unknown_service" }, 400);
  } catch (e) {
    return json({ error: "internal_error", message: String(e) }, 500);
  }
});
