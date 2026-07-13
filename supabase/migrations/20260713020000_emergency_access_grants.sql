-- Emergency Access Mode — a designated trusted person can view a locked,
-- read-only summary (liquid cash, active insurance + claim contacts, money
-- owed to the account owner) under a defined trigger, without needing their
-- own Perovo account. The single biggest silent gap in this product
-- category: when a primary earner dies or is suddenly incapacitated, the
-- family often has zero idea what exists or where.
--
-- Security model:
--   * This table is never readable by any client role, including the owner —
--     all access goes through SECURITY DEFINER RPCs/edge functions that
--     validate identity (owner) or a bearer token (trusted person) first.
--   * Only a SHA-256 hash of the access token is stored, never the raw
--     token — the same pattern as a password-reset/API-key table. The raw
--     token exists only once, at creation, to hand to the account owner to
--     share with their trusted person.
--   * A grant is scoped to exactly the fields the trusted-person view
--     returns (see the emergency-access-view edge function) — it can never
--     be used to read the full finance snapshot.
--
-- Apply with `supabase db push` after review — this file is not applied
-- automatically, and this feature needs a security review pass (rate
-- limiting on the view endpoint, token expiry policy) before shipping.

create table if not exists public.emergency_access_grants (
  id uuid primary key default gen_random_uuid(),
  granter_user_id uuid not null references auth.users (id) on delete cascade,
  trusted_person_name text not null,
  trusted_person_contact text,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  access_count int not null default 0
);

create index if not exists emergency_access_grants_granter_idx
  on public.emergency_access_grants (granter_user_id);

create index if not exists emergency_access_grants_token_hash_idx
  on public.emergency_access_grants (token_hash) where status = 'active';

alter table public.emergency_access_grants enable row level security;

-- No policies granted to any client role — deliberately. All reads/writes
-- go through SECURITY DEFINER functions below, which enforce "granter can
-- only see/revoke their own rows" and "token holder can only trigger the
-- narrow emergency-view RPC," never a direct table SELECT.

revoke all on public.emergency_access_grants from public, anon, authenticated;

-- ── Owner-facing management RPCs ────────────────────────────────────────

create or replace function public.emergency_access_list_grants()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  return coalesce(
    (
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'trustedPersonName', trusted_person_name,
        'trustedPersonContact', trusted_person_contact,
        'status', status,
        'createdAt', created_at,
        'revokedAt', revoked_at,
        'lastAccessedAt', last_accessed_at,
        'accessCount', access_count
      ) order by created_at desc)
      from public.emergency_access_grants
      where granter_user_id = auth.uid()
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.emergency_access_list_grants() from public;
grant execute on function public.emergency_access_list_grants() to authenticated;

create or replace function public.emergency_access_revoke_grant(p_grant_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  update public.emergency_access_grants
  set status = 'revoked', revoked_at = now()
  where id = p_grant_id and granter_user_id = auth.uid();

  if not found then
    raise exception 'grant_not_found';
  end if;
end;
$$;

revoke all on function public.emergency_access_revoke_grant(uuid) from public;
grant execute on function public.emergency_access_revoke_grant(uuid) to authenticated;

-- Creation happens in the emergency-access-grant edge function (not a plain
-- RPC), because the raw token must be generated + hashed together and the
-- raw value returned exactly once — an edge function can do that cleanly
-- with Deno's crypto API, whereas doing it in-database means the raw token
-- would transit through a SQL statement that also gets logged.

comment on table public.emergency_access_grants is
  'Emergency Access Mode grants — see engines/emergencyMode.js for the client view this powers.';
