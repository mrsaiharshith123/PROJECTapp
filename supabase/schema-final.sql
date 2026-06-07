-- ═══════════════════════════════════════════════════════════════════════════
-- CommitTrack — FINAL Supabase schema (paste entire file in SQL Editor → Run)
-- Safe to re-run on a fresh project or after partial migrations.
-- Tables: profiles · user_finance_snapshots · agreement_hashes
-- Admin analytics (is_admin, app_events, admin RPC): see migrations/2026060600*.sql
-- Handbook: docs/architecture/AdminAnalytics.md · supabase/README.md
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. profiles (account + subscription) ───────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  display_name text,
  phone text,
  pan text,
  pan_verified boolean not null default false,
  pan_updated_at timestamptz,
  user_mode text,
  household_scope text,
  monthly_income numeric,
  onboarding_complete boolean,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro', 'power')),
  subscription_updated_at timestamptz,
  razorpay_payment_id text
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists pan text;
alter table public.profiles add column if not exists pan_verified boolean not null default false;
alter table public.profiles add column if not exists pan_updated_at timestamptz;
alter table public.profiles add column if not exists user_mode text;
alter table public.profiles add column if not exists household_scope text;
alter table public.profiles add column if not exists monthly_income numeric;
alter table public.profiles add column if not exists onboarding_complete boolean;
alter table public.profiles add column if not exists subscription_tier text not null default 'free';
alter table public.profiles add column if not exists subscription_updated_at timestamptz;
alter table public.profiles add column if not exists razorpay_payment_id text;

comment on table public.profiles is 'CommitTrack account metadata linked to auth.users';
comment on column public.profiles.phone is 'Indian mobile (10 digits), collected at signup';
comment on column public.profiles.display_name is 'User name from signup/onboarding';
comment on column public.profiles.monthly_income is 'Monthly salary in INR';
comment on column public.profiles.onboarding_complete is 'True after onboarding flow finished';
comment on column public.profiles.subscription_tier is 'CommitTrack plan: free, pro, or power';

alter table public.profiles enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── 2. user_finance_snapshots (optional cloud backup, one row per user) ───────
create table if not exists public.user_finance_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  snapshot_version int not null default 1,
  payload jsonb not null default '{}'::jsonb,
  device_id text,
  updated_at timestamptz not null default now()
);

create index if not exists user_finance_snapshots_updated_at_idx
  on public.user_finance_snapshots (updated_at desc);

comment on table public.user_finance_snapshots is
  'CommitTrack optional cloud continuity — full local snapshot per user';

alter table public.user_finance_snapshots enable row level security;

drop policy if exists "Users manage own finance snapshot" on public.user_finance_snapshots;
create policy "Users manage own finance snapshot"
  on public.user_finance_snapshots
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 3. agreement_hashes (lending integrity seals) ───────────────────────────
create table if not exists public.agreement_hashes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lending_id text not null,
  agreement_hash text not null,
  sealed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists agreement_hashes_user_id_idx
  on public.agreement_hashes (user_id);

comment on table public.agreement_hashes is
  'SHA-256 hash of agreement text at signing time — proves document was not modified.';

alter table public.agreement_hashes enable row level security;

drop policy if exists "Users read own hashes" on public.agreement_hashes;
drop policy if exists "Users insert own hashes" on public.agreement_hashes;

create policy "Users read own hashes"
  on public.agreement_hashes for select to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own hashes"
  on public.agreement_hashes for insert to authenticated
  with check (auth.uid() = user_id);

-- ── 4. Auto-create profile row on signup ──────────────────────────────────────
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    display_name,
    phone,
    user_mode,
    household_scope,
    monthly_income,
    onboarding_complete,
    pan_verified,
    subscription_tier
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    coalesce(new.raw_user_meta_data->>'user_mode', 'salaried'),
    coalesce(new.raw_user_meta_data->>'household_scope', 'single'),
    coalesce((new.raw_user_meta_data->>'monthly_income')::numeric, 0),
    coalesce((new.raw_user_meta_data->>'onboarding_complete')::boolean, false),
    false,
    'free'
  )
  on conflict (id) do update set
    display_name = coalesce(nullif(excluded.display_name, ''), profiles.display_name),
    phone = coalesce(excluded.phone, profiles.phone),
    user_mode = coalesce(excluded.user_mode, profiles.user_mode),
    household_scope = coalesce(excluded.household_scope, profiles.household_scope),
    monthly_income = coalesce(excluded.monthly_income, profiles.monthly_income);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_committrack on auth.users;
create trigger on_auth_user_created_committrack
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();
