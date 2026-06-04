-- CommitTrack account profile (per auth user) — name, mode, KYC fields.
-- Apply via Supabase SQL editor or: supabase db push

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  pan text,
  pan_verified boolean not null default false,
  pan_updated_at timestamptz,
  display_name text,
  user_mode text,
  household_scope text,
  monthly_income numeric,
  onboarding_complete boolean
);

alter table public.profiles enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

comment on table public.profiles is 'CommitTrack account metadata linked to auth.users';
