-- Daily spend persistence for Supabase analytics.
-- Source of truth on the client is the `dailySpends` array inside:
--   user_finance_snapshots.payload.dailySpends
--
-- This migration creates `public.daily_spends` and keeps it in sync via a trigger.

-- ── 1) Table ────────────────────────────────────────────────────────────────

create table if not exists public.daily_spends (
  user_id uuid not null references auth.users (id) on delete cascade,

  spend_id text not null,
  profile_id text not null default 'default',

  amount numeric not null check (amount >= 0),
  date date not null,

  label text not null,
  life_category text not null,
  spend_type text,
  merchant_id text,
  source text,

  created_at timestamptz not null default now(),

  primary key (user_id, spend_id)
);

create index if not exists daily_spends_user_date_idx on public.daily_spends (user_id, date desc);
create index if not exists daily_spends_user_category_idx on public.daily_spends (user_id, life_category, date desc);

alter table public.daily_spends enable row level security;

drop policy if exists "Users read own daily spends" on public.daily_spends;
create policy "Users read own daily spends"
  on public.daily_spends
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Allow direct writes if we ever add a dedicated daily_spends UI/API.
-- Cloud sync still prefers the trigger-based snapshot source of truth.
drop policy if exists "Users insert own daily spends" on public.daily_spends;
create policy "Users insert own daily spends"
  on public.daily_spends
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own daily spends" on public.daily_spends;
create policy "Users update own daily spends"
  on public.daily_spends
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own daily spends" on public.daily_spends;
create policy "Users delete own daily spends"
  on public.daily_spends
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ── 2) Snapshot → daily_spends sync trigger ────────────────────────────────

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

  arr := case
    when p_payload ? 'dailySpends' then p_payload->'dailySpends'
    when p_payload ? 'daily_spends' then p_payload->'daily_spends'
    else '[]'::jsonb
  end;

  -- Snapshot payload is the ground truth; delete & re-insert.
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

comment on function public.sync_daily_spends_from_snapshot(uuid, jsonb) is
  'Triggered on user_finance_snapshots changes to materialize payload.dailySpends into public.daily_spends.';

-- Trigger wrapper — runs after snapshot upsert.
create or replace function public.daily_spends_snapshot_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only when payload exists (or changed).
  perform public.sync_daily_spends_from_snapshot(NEW.user_id, NEW.payload);
  return NEW;
end;
$$;

drop trigger if exists daily_spends_snapshot_sync on public.user_finance_snapshots;
create trigger daily_spends_snapshot_sync
after insert or update of payload
on public.user_finance_snapshots
for each row
execute function public.daily_spends_snapshot_trigger();

-- Optional: bootstrap existing rows (if any payload already has dailySpends).
-- Uncomment if you want immediate materialization.
-- do $$
-- declare r record;
-- begin
--   for r in select user_id, payload from public.user_finance_snapshots loop
--     perform public.sync_daily_spends_from_snapshot(r.user_id, r.payload);
--   end loop;
-- end $$;

