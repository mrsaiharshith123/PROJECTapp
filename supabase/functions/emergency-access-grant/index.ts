// Emergency Access Mode — create/list/revoke a grant for a trusted person.
// The raw access token is generated here and returned exactly once; only
// its SHA-256 hash is ever stored (see migrations/20260713020000_emergency_access_grants.sql).
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

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateRawToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // base64url, no padding — safe to put directly in a URL path segment.
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const MAX_ACTIVE_GRANTS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "server_not_configured" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));

    const { count, error: countError } = await admin
      .from("emergency_access_grants")
      .select("id", { count: "exact", head: true })
      .eq("granter_user_id", user.id)
      .eq("status", "active");
    if (countError) return json({ error: "internal_error" }, 500);
    if ((count ?? 0) >= MAX_ACTIVE_GRANTS) {
      return json({ error: "grant_limit_reached", limit: MAX_ACTIVE_GRANTS }, 400);
    }

    const trustedPersonName = String(body.trustedPersonName || "").trim().slice(0, 80);
    if (!trustedPersonName) return json({ error: "trusted_person_name_required" }, 400);
    const trustedPersonContact = String(body.trustedPersonContact || "").trim().slice(0, 80) || null;

    const rawToken = generateRawToken();
    const tokenHash = await sha256Hex(rawToken);

    const { data: inserted, error: insertError } = await admin
      .from("emergency_access_grants")
      .insert({
        granter_user_id: user.id,
        trusted_person_name: trustedPersonName,
        trusted_person_contact: trustedPersonContact,
        token_hash: tokenHash,
      })
      .select("id, created_at")
      .single();
    if (insertError) return json({ error: "internal_error" }, 500);

    // Returned exactly once — the caller must show/share this immediately;
    // it cannot be recovered later, only revoked and a new grant created.
    return json({ id: inserted.id, createdAt: inserted.created_at, token: rawToken });
  } catch (e) {
    return json({ error: "internal_error", message: String(e) }, 500);
  }
});
