-- Security hardening pass (technical due-diligence follow-up, 2026-07-13).
--
-- "Admins read all profiles" (added in 20260606000000, redefined in
-- 20260606010000) granted any admin a raw `select *` on public.profiles via
-- RLS. Every legitimate admin read path already goes through
-- admin_list_users()/admin_update_user(), which mask email/phone and omit
-- full PAN — but this policy let the same admin bypass that masking
-- entirely with a direct `supabase.from('profiles').select('*')` call, and
-- an attacker who compromised an admin session (e.g. via XSS) could do the
-- same to get unmasked PAN/phone/income/razorpay_payment_id for every user.
--
-- admin_list_users/admin_update_user/admin_product_overview are all
-- SECURITY DEFINER, which bypasses RLS for their own queries regardless of
-- this policy — so removing it does not affect any admin RPC. A repo-wide
-- search found zero direct `.from('profiles')` calls in src/, confirming
-- the client never relies on this policy either.
--
-- Apply with `supabase db push` (or your normal migration pipeline) after
-- review — this file is not applied automatically.

drop policy if exists "Admins read all profiles" on public.profiles;

-- app_events had the same blanket-admin-read shape; admin_product_overview
-- is SECURITY DEFINER and does not need it either.
drop policy if exists "Admins read all events" on public.app_events;

-- Admins now read other users' profile data exclusively through
-- admin_list_users()/admin_update_user()/admin_product_overview(), all of
-- which enforce admin_assert_caller() internally and mask PII in their
-- responses. Regular users keep their existing "read/update own row" access
-- via profiles_select_own / profiles_update_own (unchanged by this file).
