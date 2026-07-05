import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { JWT } from "npm:google-auth-library@9";

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

async function getFcmAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  project_id: string;
}) {
  const jwt = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  });
  const token = await jwt.getAccessToken();
  if (!token.token) throw new Error("fcm_token_failed");
  return { accessToken: token.token, projectId: serviceAccount.project_id };
}

async function sendFcmMessage(
  accessToken: string,
  projectId: string,
  deviceToken: string,
  title: string,
  body: string,
  route: string | null,
) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        notification: { title, body },
        data: route ? { route } : {},
        android: { priority: "HIGH" },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fcm_send_failed:${res.status}:${text.slice(0, 200)}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const fcmJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json({ error: "server_not_configured" }, 500);
    }
    if (!fcmJson) {
      return json({ error: "fcm_not_configured" }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "unauthorized" }, 401);

    const { data: adminRow } = await userClient
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (!adminRow?.is_admin) return json({ error: "not_admin" }, 403);

    const body = await req.json().catch(() => ({}));
    const broadcastId = String(body.broadcast_id || body.broadcastId || "");
    if (!broadcastId) return json({ error: "missing_broadcast_id" }, 400);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: broadcast, error: broadcastError } = await adminClient
      .from("app_broadcasts")
      .select("id, title, body, route, target_tiers")
      .eq("id", broadcastId)
      .maybeSingle();
    if (broadcastError || !broadcast) return json({ error: "broadcast_not_found" }, 404);

    const serviceAccount = JSON.parse(fcmJson);
    const { accessToken, projectId } = await getFcmAccessToken(serviceAccount);

    const { data: tokens, error: tokensError } = await adminClient
      .from("user_push_tokens")
      .select("token, user_id");
    if (tokensError) return json({ error: tokensError.message }, 500);

    let sent = 0;
    let failed = 0;
    const route = broadcast.route || null;

    for (const row of tokens || []) {
      if (!row.token) continue;
      try {
        await sendFcmMessage(
          accessToken,
          projectId,
          row.token,
          broadcast.title,
          broadcast.body,
          route,
        );
        sent += 1;
      } catch {
        failed += 1;
      }
    }

    return json({ ok: true, sent, failed, total: (tokens || []).length });
  } catch (e) {
    return json({ error: "internal_error", message: String(e) }, 500);
  }
});
