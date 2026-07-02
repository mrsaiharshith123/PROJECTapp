import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Tier = "pro" | "power";

const TIER_ANNUAL_PAISE: Record<Tier, number> = {
  pro: 84300,
  power: 169500,
};

const TIER_MONTHLY_PAISE: Record<Tier, number> = {
  pro: 9900,
  power: 19900,
};

function tierAmountPaise(tier: Tier, billing: unknown): number {
  if (billing === "monthly") return TIER_MONTHLY_PAISE[tier];
  return TIER_ANNUAL_PAISE[tier];
}

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

async function fetchRazorpayJson(path: string, basicAuth: string) {
  const res = await fetch(`https://api.razorpay.com/v1/${path}`, {
    headers: { Authorization: `Basic ${basicAuth}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`razorpay_fetch_failed:${res.status}:${errText.slice(0, 200)}`);
  }
  return await res.json();
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

    const webhookSig = req.headers.get("X-Razorpay-Signature");
    if (webhookSig) {
      const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
      if (!webhookSecret) {
        return json({ error: "webhook_not_configured" }, 500);
      }
      if (!supabaseUrl || !serviceRoleKey || !razorpayKeyId || !razorpayKeySecret) {
        return json({ error: "server_misconfigured" }, 500);
      }
      const raw = await req.text();
      const expected = await hmacSha256Hex(webhookSecret, raw);
      if (expected !== webhookSig) {
        return json({ error: "invalid_webhook_signature" }, 401);
      }
      const event = JSON.parse(raw);
      if (event?.event === "payment.captured") {
        const payment = event?.payload?.payment?.entity;
        const orderId = String(payment?.order_id || "");
        const paymentId = String(payment?.id || "");
        if (orderId && paymentId && payment?.status === "captured") {
          const adminClient = createClient(supabaseUrl, serviceRoleKey);
          const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
          try {
            const order = await fetchRazorpayJson(`orders/${orderId}`, basicAuth);
            const notes = order.notes || {};
            const userId = String(notes.user_id || "");
            const tier = notes.tier;
            if (userId && isTier(tier)) {
              const { data: prior } = await adminClient
                .from("payment_verifications")
                .select("tier")
                .eq("payment_id", paymentId)
                .maybeSingle();
              if (!prior) {
                await adminClient
                  .from("profiles")
                  .update({
                    subscription_tier: tier,
                    razorpay_payment_id: paymentId,
                    subscription_updated_at: new Date().toISOString(),
                  })
                  .eq("id", userId);
                await adminClient.from("payment_verifications").insert({
                  payment_id: paymentId,
                  user_id: userId,
                  tier,
                });
              }
            }
          } catch (webhookErr) {
            console.error("webhook processing failed:", webhookErr);
            return json({ error: "webhook_processing_failed" }, 500);
          }
        }
      }
      return json({ ok: true, webhook: true });
    }

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

      const billing = body?.billing === "monthly" ? "monthly" : "yearly";
      const amount = tierAmountPaise(tier, billing);
      const receipt = `ct_${user.id.replace(/-/g, "").slice(0, 12)}_${tier}_${billing}_${Date.now()}`;
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
          notes: { tier, billing, user_id: user.id },
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
      const paymentId = String(body?.razorpay_payment_id ?? "");
      const orderId = String(body?.razorpay_order_id ?? "");
      const signature = String(body?.razorpay_signature ?? "");

      if (!paymentId || !orderId || !signature) {
        return json({ error: "Missing payment fields." }, 400);
      }

      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

      const { data: prior } = await adminClient
        .from("payment_verifications")
        .select("tier")
        .eq("payment_id", paymentId)
        .maybeSingle();

      if (prior?.tier) {
        const priorTier = prior.tier as Tier;
        return json({
          ok: true,
          tier: priorTier,
          paymentId,
          amount: tierAmountPaise(priorTier, body?.billing === "monthly" ? "monthly" : "yearly"),
          alreadyVerified: true,
        });
      }

      const expected = await hmacSha256Hex(razorpayKeySecret, `${orderId}|${paymentId}`);
      if (expected !== signature) {
        return json({ error: "Invalid payment signature." }, 400);
      }

      let order: { amount?: number; notes?: Record<string, string> };
      let payment: { order_id?: string; status?: string };
      try {
        order = await fetchRazorpayJson(`orders/${orderId}`, basicAuth);
        payment = await fetchRazorpayJson(`payments/${paymentId}`, basicAuth);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment lookup failed.";
        return json({ error: message }, 502);
      }

      if (String(payment.order_id || "") !== orderId) {
        return json({ error: "Payment does not match order." }, 400);
      }
      if (payment.status !== "captured") {
        return json({ error: "Payment not captured." }, 400);
      }

      const notes = order.notes || {};
      const noteUserId = String(notes.user_id || "");
      const noteTier = notes.tier;
      const noteBilling = notes.billing === "monthly" ? "monthly" : "yearly";

      if (noteUserId !== user.id) {
        return json({ error: "Order user mismatch." }, 400);
      }
      if (!isTier(noteTier)) {
        return json({ error: "Invalid order tier." }, 400);
      }

      const expectedAmount = tierAmountPaise(noteTier, noteBilling);
      if (Number(order.amount) !== expectedAmount) {
        return json({ error: "Order amount mismatch." }, 400);
      }

      const tier = noteTier;

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

      await adminClient.from("payment_verifications").insert({
        payment_id: paymentId,
        user_id: user.id,
        tier,
      });

      return json({
        ok: true,
        tier,
        paymentId,
        amount: expectedAmount,
      });
    }

    if (action === "dev-simulate") {
      if (Deno.env.get("ALLOW_DEV_SIMULATE_PAY") !== "true") {
        return json({ error: "Dev simulation disabled." }, 403);
      }
      if (Deno.env.get("DENO_ENV") === "production" || Deno.env.get("ENVIRONMENT") === "production") {
        return json({ error: "Dev simulation disabled in production." }, 403);
      }
      const tier = body?.tier;
      if (!isTier(tier)) return json({ error: "Invalid tier." }, 400);

      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const paymentId = `dev_sim_${Date.now()}`;
      const { error } = await adminClient
        .from("profiles")
        .update({
          subscription_tier: tier,
          razorpay_payment_id: paymentId,
          subscription_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, tier, paymentId, simulated: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment error.";
    return json({ error: message }, 500);
  }
});
