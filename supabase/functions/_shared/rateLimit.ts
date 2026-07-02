import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export async function checkUsageRateLimit(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  functionName: string,
  limit: number,
  windowMs = 24 * 60 * 60 * 1000,
) {
  if (limit <= 0) return { ok: false as const, reason: "rate_limit_exceeded" };
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await adminClient
    .from("ai_insight_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("function_name", functionName)
    .gte("created_at", since);
  if (error) return { ok: false as const, reason: "rate_limit_error" };
  if ((count ?? 0) >= limit) return { ok: false as const, reason: "rate_limit_exceeded", limit };
  return { ok: true as const, limit };
}

export async function logUsage(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  functionName: string,
) {
  await adminClient.from("ai_insight_usage").insert({
    user_id: userId,
    function_name: functionName,
  });
}
