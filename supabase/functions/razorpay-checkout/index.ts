import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TIER_AMOUNTS: Record<string, number> = {
  pro: 79900,
  power: 149900,
};

type Tier = "pro" | "power";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacSha256Hex(secret: string, body: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isTier(value: unknown): value is Tier {
  return value === "pro" || value === "power";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
      return json({ error: "Payment service is not configured on the server." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Sign in required." }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return json({ error: "Unauthorized." }, 401);
    }

    const body = await req.json();
    const action = body?.action;

    if (action === "create-order") {
      const tier = body?.tier;
      if (!isTier(tier)) {
        return json({ error: "Invalid tier." }, 400);
      }

      const amount = TIER_AMOUNTS[tier];
      const receipt = `ct_${user.id.replace(/-/g, "").slice(0, 12)}_${tier}_${Date.now()}`;
      const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt,
          notes: { tier, user_id: user.id },
        }),
      });

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        return json({ error: `Razorpay order failed: ${errText}` }, 502);
      }

      const order = await orderRes.json();
      return json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
      });
    }

    if (action === "verify") {
      const tier = body?.tier;
      const paymentId = String(body?.razorpay_payment_id ?? "");
      const orderId = String(body?.razorpay_order_id ?? "");
      const signature = String(body?.razorpay_signature ?? "");

      if (!isTier(tier) || !paymentId || !orderId || !signature) {
        return json({ error: "Missing payment fields." }, 400);
      }

      const expected = await hmacSha256Hex(razorpayKeySecret, `${orderId}|${paymentId}`);
      if (expected !== signature) {
        return json({ error: "Invalid payment signature." }, 400);
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { error } = await adminClient
        .from("profiles")
        .update({
          subscription_tier: tier,
          razorpay_payment_id: paymentId,
          subscription_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        return json({ error: error.message }, 500);
      }

      return json({
        ok: true,
        tier,
        paymentId,
        amount: TIER_AMOUNTS[tier],
      });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment error.";
    return json({ error: message }, 500);
  }
});
