import { getSupabaseClient } from "../supabase/auth.js";

/** @param {{ userId: string, lendingId: string, hash: string, sealedAt: string }} params */
export async function persistAgreementHash({ userId, lendingId, hash, sealedAt }) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase
    .from("agreement_hashes")
    .insert({
      user_id: userId,
      lending_id: String(lendingId),
      agreement_hash: hash,
      sealed_at: sealedAt,
    })
    .then(() => {})
    .catch(console.error);
}
