-- Backup history archive (keep last 2 per user)
create table if not exists public.user_finance_backup_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  snapshot_version int not null default 1,
  device_id text,
  backed_up_at timestamptz not null default now()
);

create index if not exists user_finance_backup_history_user_id_idx
  on public.user_finance_backup_history (user_id, backed_up_at desc);

alter table public.user_finance_backup_history enable row level security;

create policy "Users read own backup history"
  on public.user_finance_backup_history for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own backup history"
  on public.user_finance_backup_history for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users delete own backup history"
  on public.user_finance_backup_history for delete
  to authenticated
  using (auth.uid() = user_id);

-- App-wide broadcasts
create table if not exists public.app_broadcasts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in (
    'app_update', 'sale', 'security', 'feature', 'tip', 'maintenance'
  )),
  title text not null,
  body text not null,
  target_tiers text[] default null,
  route text default null,
  target_created_before timestamptz default null,
  active_from timestamptz not null default now(),
  active_until timestamptz default null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.app_broadcasts enable row level security;

create policy "Authenticated users can read broadcasts"
  on public.app_broadcasts for select
  to authenticated
  using (
    active_from <= now()
    and (active_until is null or active_until > now())
  );

create table if not exists public.user_broadcast_dismissals (
  user_id uuid references auth.users(id) on delete cascade,
  broadcast_id uuid references public.app_broadcasts(id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, broadcast_id)
);

alter table public.user_broadcast_dismissals enable row level security;

create policy "Users manage own dismissals"
  on public.user_broadcast_dismissals for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Per-user notifications (security alerts, etc.)
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  route text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_id_idx
  on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;

create policy "Users read own notifications"
  on public.user_notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.user_notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users insert own notifications"
  on public.user_notifications for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Migrate power tier users to pro
update public.profiles
  set subscription_tier = 'pro'
  where subscription_tier = 'power';

alter table public.profiles
  drop constraint if exists profiles_subscription_tier_check;

alter table public.profiles
  add constraint profiles_subscription_tier_check
  check (subscription_tier in ('free', 'pro', 'power'));
