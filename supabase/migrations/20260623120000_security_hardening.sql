-- Security hardening: subscription tier protection, household RLS, paid backup, AI rate limits

-- ── 1. Block client writes to subscription_tier / razorpay_payment_id ─────────
create or replace function public.protect_profiles_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.subscription_tier := 'free';
    new.razorpay_payment_id := null;
    return new;
  end if;
  if old.subscription_tier is distinct from new.subscription_tier
     or old.razorpay_payment_id is distinct from new.razorpay_payment_id
     or old.subscription_updated_at is distinct from new.subscription_updated_at then
    new.subscription_tier := old.subscription_tier;
    new.razorpay_payment_id := old.razorpay_payment_id;
    new.subscription_updated_at := old.subscription_updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profiles_subscription on public.profiles;
create trigger protect_profiles_subscription
  before insert or update on public.profiles
  for each row execute function public.protect_profiles_subscription();

comment on function public.protect_profiles_subscription() is
  'Only service_role (Razorpay edge verify) may change subscription_tier';

-- ── 2. Household rooms — remove global SELECT; lookup by invite code via RPC ───
drop policy if exists "Anyone authenticated lookup room by code for join" on public.household_rooms;

create or replace function public.lookup_household_room_by_invite(p_invite_code text)
returns table (
  id uuid,
  invite_code text,
  name text,
  owner_id uuid,
  member_limit int
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.invite_code, r.name, r.owner_id, r.member_limit
  from public.household_rooms r
  where r.invite_code = upper(trim(p_invite_code))
  limit 1;
$$;

revoke all on function public.lookup_household_room_by_invite(text) from public;
grant execute on function public.lookup_household_room_by_invite(text) to authenticated;

-- ── 3. Cloud backup — paid tier required for push (insert/update) ─────────────
create or replace function public.user_has_paid_backup_tier()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select p.subscription_tier in ('pro', 'power')
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

drop policy if exists "Users manage own finance snapshot" on public.user_finance_snapshots;

create policy "Users read own finance snapshot"
  on public.user_finance_snapshots
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Paid users upsert own finance snapshot"
  on public.user_finance_snapshots
  for insert
  to authenticated
  with check (auth.uid() = user_id and public.user_has_paid_backup_tier());

create policy "Paid users update own finance snapshot"
  on public.user_finance_snapshots
  for update
  to authenticated
  using (auth.uid() = user_id and public.user_has_paid_backup_tier())
  with check (auth.uid() = user_id and public.user_has_paid_backup_tier());

create policy "Users delete own finance snapshot"
  on public.user_finance_snapshots
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── 4. AI insight rate limiting (edge functions log via service role) ─────────
create table if not exists public.ai_insight_usage (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  function_name text not null default 'asset-insight',
  created_at timestamptz not null default now()
);

create index if not exists ai_insight_usage_user_time_idx
  on public.ai_insight_usage (user_id, function_name, created_at desc);

alter table public.ai_insight_usage enable row level security;

-- No client policies — edge uses service_role only

-- ── 5. Razorpay payment idempotency ───────────────────────────────────────────
create table if not exists public.payment_verifications (
  payment_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  tier text not null check (tier in ('pro', 'power')),
  verified_at timestamptz not null default now()
);

alter table public.payment_verifications enable row level security;

create index if not exists payment_verifications_user_idx
  on public.payment_verifications (user_id);
