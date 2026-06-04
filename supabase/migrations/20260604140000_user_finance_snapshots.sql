-- CommitTrack Cloud Sync — one encrypted-at-rest JSON snapshot per user (RLS isolated).
-- Apply via Supabase SQL editor or: supabase db push

create table if not exists public.user_finance_snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  snapshot_version int not null default 1,
  payload jsonb not null default '{}'::jsonb,
  device_id text,
  updated_at timestamptz not null default now()
);

create index if not exists user_finance_snapshots_updated_at_idx
  on public.user_finance_snapshots (updated_at desc);

alter table public.user_finance_snapshots enable row level security;

drop policy if exists "Users manage own finance snapshot" on public.user_finance_snapshots;
create policy "Users manage own finance snapshot"
  on public.user_finance_snapshots
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.user_finance_snapshots is 'CommitTrack optional cloud continuity — full local snapshot per user';
