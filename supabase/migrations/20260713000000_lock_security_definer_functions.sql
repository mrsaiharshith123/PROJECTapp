-- Security hardening pass (technical due-diligence follow-up, 2026-07-13).
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default. Most of the
-- SECURITY DEFINER functions in this schema were created with an explicit
-- `grant execute ... to authenticated` but never an explicit
-- `revoke ... from public` first — so despite the intent, PUBLIC (which
-- includes the `anon` role) has also had EXECUTE all along. This migration
-- closes that gap everywhere, and fixes one function that had no internal
-- authorization check at all.
--
-- Apply with `supabase db push` (or your normal migration pipeline) after
-- review — this file is not applied automatically.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) REAL BUG: sync_daily_spends_from_snapshot(uuid, jsonb) took an arbitrary
-- p_user_id with no check that it matched the caller. It is SECURITY DEFINER
-- and, absent a REVOKE, was callable directly via RPC by any authenticated
-- (or anon) client with any other user's uuid — an IDOR that could delete
-- and overwrite another user's public.daily_spends rows. It is only ever
-- meant to run from daily_spends_snapshot_trigger() with NEW.user_id, which
-- RLS on user_finance_snapshots already guarantees equals auth.uid(). Add
-- the missing check and stop granting direct execute to anyone — trigger
-- invocation does not require an EXECUTE grant.
create or replace function public.sync_daily_spends_from_snapshot(p_user_id uuid, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  arr jsonb;
begin
  if p_user_id is null then
    raise exception 'sync_daily_spends_from_snapshot: user id required';
  end if;

  if p_user_id is distinct from auth.uid() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  arr := case
    when p_payload ? 'dailySpends' then p_payload->'dailySpends'
    when p_payload ? 'daily_spends' then p_payload->'daily_spends'
    else '[]'::jsonb
  end;

  delete from public.daily_spends where user_id = p_user_id;

  insert into public.daily_spends (
    user_id,
    spend_id,
    profile_id,
    amount,
    date,
    label,
    life_category,
    spend_type,
    merchant_id,
    source,
    created_at
  )
  select
    p_user_id,
    coalesce(e->>'id', '') as spend_id,
    coalesce(e->>'profileId', 'default') as profile_id,
    coalesce(nullif(e->>'amount','')::numeric, 0) as amount,
    coalesce(nullif(e->>'date','')::date, current_date) as date,
    coalesce(nullif(e->>'label',''), 'Spend') as label,
    coalesce(nullif(e->>'lifeCategory',''), 'risk') as life_category,
    nullif(e->>'spendType','') as spend_type,
    nullif(e->>'merchantId','') as merchant_id,
    nullif(e->>'source','') as source,
    to_timestamp(
      case
        when jsonb_typeof(e->'createdAt') = 'number' then (e->>'createdAt')::numeric / 1000
        when jsonb_typeof(e->'createdAt') = 'string' then nullif(e->>'createdAt','')::numeric / 1000
        else extract(epoch from now())
      end
    ) as created_at
  from jsonb_array_elements(arr) e
  where coalesce(e->>'id','') <> '';
end;
$$;

revoke all on function public.sync_daily_spends_from_snapshot(uuid, jsonb) from public;
revoke all on function public.sync_daily_spends_from_snapshot(uuid, jsonb) from authenticated;
-- Intentionally not granted to any client role — only reachable via
-- daily_spends_snapshot_trigger(), which runs as the function owner.

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Defense-in-depth: every other SECURITY DEFINER function in this schema
-- already has an internal admin/ownership check (admin_assert_caller(),
-- or scopes to auth.uid()), so this section does not fix a live exploit —
-- it removes the PUBLIC/anon execute surface those internal checks were
-- quietly relying on masking, matching the standing checklist item added
-- after the grant_perovo_admin incident (see 20260703000000).

revoke all on function public.is_perovo_admin() from public;
grant execute on function public.is_perovo_admin() to authenticated;

revoke all on function public.admin_assert_caller() from public;
grant execute on function public.admin_assert_caller() to authenticated;

revoke all on function public.admin_list_users(text, int, int) from public;
grant execute on function public.admin_list_users(text, int, int) to authenticated;

revoke all on function public.admin_update_user(uuid, jsonb) from public;
grant execute on function public.admin_update_user(uuid, jsonb) to authenticated;

revoke all on function public.admin_set_user_admin(uuid, boolean) from public;
grant execute on function public.admin_set_user_admin(uuid, boolean) to authenticated;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;

revoke all on function public.admin_ban_user(uuid, boolean) from public;
grant execute on function public.admin_ban_user(uuid, boolean) to authenticated;

revoke all on function public.admin_verify_email(uuid) from public;
grant execute on function public.admin_verify_email(uuid) to authenticated;

revoke all on function public.admin_revoke_sessions(uuid) from public;
grant execute on function public.admin_revoke_sessions(uuid) to authenticated;

revoke all on function public.admin_product_overview() from public;
grant execute on function public.admin_product_overview() to authenticated;

revoke all on function public.touch_profile_activity() from public;
grant execute on function public.touch_profile_activity() to authenticated;

revoke all on function public.user_has_paid_backup_tier() from public;
grant execute on function public.user_has_paid_backup_tier() to authenticated;

-- Trigger-only functions — never meant to be called directly by any client
-- role. Triggers fire regardless of EXECUTE grants, so revoking from
-- everyone (and granting to no one) is correct and changes no behavior.
revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.profiles_guard_admin_column() from public;
revoke all on function public.daily_spends_snapshot_trigger() from public;
revoke all on function public.protect_profiles_subscription() from public;
revoke all on function public.protect_profiles_pan_verified() from public;
