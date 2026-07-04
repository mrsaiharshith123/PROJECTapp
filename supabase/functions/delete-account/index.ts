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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return json({ error: "server_not_configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) return json({ error: deleteError.message }, 500);

    await adminClient.from("user_finance_snapshots").delete().eq("user_id", user.id);
    await adminClient.from("user_finance_backup_history").delete().eq("user_id", user.id);
    await adminClient.from("payment_verifications").delete().eq("user_id", user.id);
    await adminClient.from("ai_insight_usage").delete().eq("user_id", user.id);
    await adminClient.from("user_device_sessions").delete().eq("user_id", user.id);
    await adminClient.from("app_events").delete().eq("user_id", user.id);
    await adminClient.from("agreement_hashes").delete().eq("user_id", user.id);
    await adminClient.from("api_proxy_documents").delete().eq("user_id", user.id);
    await adminClient.from("daily_spends").delete().eq("user_id", user.id);
    await adminClient.from("user_broadcast_dismissals").delete().eq("user_id", user.id);
    await adminClient.from("user_notifications").delete().eq("user_id", user.id);
    await adminClient.from("profiles").delete().eq("id", user.id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: "internal_error", message: String(e) }, 500);
  }
});
