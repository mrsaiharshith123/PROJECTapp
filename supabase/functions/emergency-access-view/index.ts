// Emergency Access Mode — token-based, unauthenticated view. Returns ONLY
// the four safe fields (instant/7-day cash, active insurance + claim
// contact, money owed to the account owner) — never the raw finance
// snapshot, never anything else. See migrations/20260713020000_emergency_access_grants.sql
// for the security model (hashed tokens, no direct table access).
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

// Liquidity tier — mirrors src/engines/netWorth/liquidityLadder.js's
// instant/fast rung classification. Kept as an independent, deliberately
// minimal port here rather than sharing a module across the Vite client
// build and this Deno edge function.
const INSTANT_CATEGORY_IDS = new Set(["bank", "cash", "savings", "emergency"]);
const FAST_CATEGORY_IDS = new Set(["sip", "stocks", "mutual_fund", "gold", "crypto", "fd"]);

type WealthEntry = {
  kind?: string;
  categoryId?: string;
  value?: number;
  hidden?: boolean;
};

function sumByRung(entries: WealthEntry[]) {
  let instant = 0;
  let fast = 0;
  for (const e of entries || []) {
    if (e.kind !== "asset" || e.hidden) continue;
    const value = Math.max(0, Number(e.value) || 0);
    const cat = String(e.categoryId || "");
    if (INSTANT_CATEGORY_IDS.has(cat)) instant += value;
    else if (FAST_CATEGORY_IDS.has(cat)) fast += value;
  }
  return { instant, within7Days: instant + fast };
}

// Rate-limit floor: an access can happen at most once every 30 seconds per
// grant, independent of any other limiter — cheap protection against a
// leaked/guessed token being hammered.
const MIN_ACCESS_INTERVAL_MS = 30_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "server_not_configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const rawToken = String(body.token || "").trim();
    if (!rawToken || rawToken.length < 20) return json({ error: "invalid_token" }, 400);

    const tokenHash = await sha256Hex(rawToken);
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: grant, error: grantError } = await admin
      .from("emergency_access_grants")
      .select("id, granter_user_id, status, last_accessed_at, access_count")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (grantError || !grant || grant.status !== "active") {
      return json({ error: "invalid_or_revoked_token" }, 404);
    }

    if (grant.last_accessed_at) {
      const elapsed = Date.now() - new Date(grant.last_accessed_at).getTime();
      if (elapsed < MIN_ACCESS_INTERVAL_MS) {
        return json({ error: "rate_limited", retryAfterMs: MIN_ACCESS_INTERVAL_MS - elapsed }, 429);
      }
    }

    const { data: snapshot, error: snapshotError } = await admin
      .from("user_finance_snapshots")
      .select("payload")
      .eq("user_id", grant.granter_user_id)
      .maybeSingle();

    if (snapshotError || !snapshot) {
      return json({ error: "no_data_available" }, 404);
    }

    const payload = (snapshot.payload || {}) as {
      commitments?: Array<Record<string, unknown>>;
      lendings?: Array<Record<string, unknown>>;
      wealth?: { entries?: WealthEntry[] };
    };

    const cash = sumByRung(payload.wealth?.entries || []);

    const activeInsurance = (payload.commitments || [])
      .filter((c) => c.category === "Insurance" && c.status !== "paid")
      .map((c) => ({
        name: String(c.name || ""),
        insurer: String(c.insuranceCompany || ""),
        sumAssured: c.insuranceSumAssured ? Number(c.insuranceSumAssured) : null,
        claimContact: String(c.insuranceClaimContact || ""),
      }));

    const owedToUser = (payload.lendings || [])
      .filter((l) => l.type === "lent" && Math.max(0, Number(l.remainingAmount) || 0) > 0)
      .map((l) => ({ personName: String(l.personName || ""), remainingAmount: Math.max(0, Number(l.remainingAmount) || 0) }))
      .sort((a, b) => b.remainingAmount - a.remainingAmount);

    await admin
      .from("emergency_access_grants")
      .update({ last_accessed_at: new Date().toISOString(), access_count: (grant.access_count ?? 0) + 1 })
      .eq("id", grant.id);

    return json({
      instantCash: cash.instant,
      within7DaysCash: cash.within7Days,
      activeInsurance,
      owedToUser,
      totalOwedToUser: owedToUser.reduce((s, l) => s + l.remainingAmount, 0),
    });
  } catch (e) {
    return json({ error: "internal_error", message: String(e) }, 500);
  }
});
