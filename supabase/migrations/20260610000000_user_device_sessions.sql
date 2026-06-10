-- Active device sessions per user (client-reported; used for security UI + revoke).
create table if not exists public.user_device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  device_label text,
  city text,
  region text,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, device_id)
);

create index if not exists user_device_sessions_user_id_idx
  on public.user_device_sessions (user_id, last_active_at desc);

alter table public.user_device_sessions enable row level security;

create policy "Users read own device sessions"
  on public.user_device_sessions for select
  using (auth.uid() = user_id);

create policy "Users insert own device sessions"
  on public.user_device_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users update own device sessions"
  on public.user_device_sessions for update
  using (auth.uid() = user_id);

comment on table public.user_device_sessions is 'Per-device sign-in rows for security screen (revoke + location label).';
